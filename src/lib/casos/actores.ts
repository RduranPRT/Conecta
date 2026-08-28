import { and, eq, exists, inArray, ilike, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  categorias,
  coberturas,
  comunas,
  perfilCategorias,
  perfilRoles,
  perfiles,
  regiones,
  verificaciones,
  type RolActor,
} from "@/db/schema";
import { distanciaKm } from "@/lib/geo";
import { puntuar } from "./puntaje";
import type { Intencion } from "@/lib/ia";

export { puntuar } from "./puntaje";

export type ActorResumen = {
  id: number;
  slug: string;
  nombre: string;
  descripcion: string | null;
  avatarUrl: string | null;
  comunaId: number | null;
  comunaNombre: string | null;
  regionNombre: string | null;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  radioKm: number | null;
  disponibleAhora: boolean;
  reputacionPromedio: string | null;
  reputacionConteo: number;
  plan: "gratis" | "profesional" | "empresa";
  roles: RolActor[];
  categorias: { id: number; nombre: string; slug: string }[];
  verificado: boolean;
  distanciaKm: number | null;
  puntaje: number;
  motivo: string;
};

type Opciones = {
  desde?: { lat: number; lng: number } | null;
  limite?: number;
  soloConUbicacion?: boolean;
  /** Restringe a estos roles aunque la intención no los mencione. */
  roles?: RolActor[];
  comunaId?: number | null;
};

/**
 * Búsqueda de actores: una sola consulta que sirve al buscador, al mapa,
 * al matching de necesidades y al asistente. Es la «única fuente de verdad»
 * del prompt: si un prestador se pone «disponible ahora», los cuatro lo ven.
 */
export async function buscarActores(
  intencion: Intencion,
  opciones: Opciones = {},
): Promise<ActorResumen[]> {
  const limite = opciones.limite ?? 40;
  const condiciones: SQL[] = [];

  const comunaId = opciones.comunaId ?? intencion.comunaId;
  if (comunaId) {
    // Ubicación física en la comuna O zona de cobertura declarada sobre ella.
    condiciones.push(
      or(
        eq(perfiles.comunaId, comunaId),
        exists(
          db
            .select({ x: sql`1` })
            .from(coberturas)
            .where(and(eq(coberturas.perfilId, perfiles.id), eq(coberturas.comunaId, comunaId))),
        ),
      )!,
    );
  }

  const roles = opciones.roles?.length ? opciones.roles : intencion.roles;
  if (roles.length) {
    condiciones.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(perfilRoles)
          .where(
            and(
              eq(perfilRoles.perfilId, perfiles.id),
              inArray(perfilRoles.rol, roles),
              eq(perfilRoles.activo, true),
            ),
          ),
      ),
    );
  }

  // Categoría y texto se combinan con OR: la categoría acota, el texto rescata.
  const alternativas: SQL[] = [];
  if (intencion.categoriaId) {
    alternativas.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(perfilCategorias)
          .where(
            and(
              eq(perfilCategorias.perfilId, perfiles.id),
              eq(perfilCategorias.categoriaId, intencion.categoriaId),
            ),
          ),
      ),
    );
  }
  for (const termino of intencion.terminos.slice(0, 4)) {
    const patron = `%${termino}%`;
    alternativas.push(ilike(perfiles.nombre, patron));
    alternativas.push(ilike(sql`coalesce(${perfiles.descripcion}, '')`, patron));
    alternativas.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(perfilCategorias)
          .innerJoin(categorias, eq(categorias.id, perfilCategorias.categoriaId))
          .where(and(eq(perfilCategorias.perfilId, perfiles.id), ilike(categorias.nombre, patron))),
      ),
    );
  }
  if (alternativas.length) condiciones.push(or(...alternativas)!);

  // La disponibilidad no filtra a nadie fuera: pesa en el orden (ver `puntuar`).

  if (opciones.soloConUbicacion) {
    condiciones.push(sql`${perfiles.lat} is not null and ${perfiles.lng} is not null`);
  }

  const filas = await db
    .select({
      id: perfiles.id,
      slug: perfiles.slug,
      nombre: perfiles.nombre,
      descripcion: perfiles.descripcion,
      avatarUrl: perfiles.avatarUrl,
      comunaId: perfiles.comunaId,
      comunaNombre: comunas.nombre,
      regionNombre: regiones.nombre,
      direccion: perfiles.direccion,
      lat: perfiles.lat,
      lng: perfiles.lng,
      radioKm: perfiles.radioKm,
      disponibleAhora: perfiles.disponibleAhora,
      reputacionPromedio: perfiles.reputacionPromedio,
      reputacionConteo: perfiles.reputacionConteo,
      plan: perfiles.plan,
    })
    .from(perfiles)
    .leftJoin(comunas, eq(comunas.id, perfiles.comunaId))
    .leftJoin(regiones, eq(regiones.id, comunas.regionId))
    .where(condiciones.length ? and(...condiciones) : undefined)
    .limit(200);

  if (!filas.length) return [];

  const ids = filas.map((f) => f.id);
  const [rolesFilas, categoriasFilas, verificadas] = await Promise.all([
    db
      .select({ perfilId: perfilRoles.perfilId, rol: perfilRoles.rol })
      .from(perfilRoles)
      .where(and(inArray(perfilRoles.perfilId, ids), eq(perfilRoles.activo, true))),
    db
      .select({
        perfilId: perfilCategorias.perfilId,
        id: categorias.id,
        nombre: categorias.nombre,
        slug: categorias.slug,
      })
      .from(perfilCategorias)
      .innerJoin(categorias, eq(categorias.id, perfilCategorias.categoriaId))
      .where(inArray(perfilCategorias.perfilId, ids)),
    db
      .select({ perfilId: verificaciones.perfilId })
      .from(verificaciones)
      .where(
        and(inArray(verificaciones.perfilId, ids), eq(verificaciones.estado, "verificado")),
      ),
  ]);

  const porPerfilRoles = new Map<number, RolActor[]>();
  for (const r of rolesFilas) {
    porPerfilRoles.set(r.perfilId, [...(porPerfilRoles.get(r.perfilId) ?? []), r.rol]);
  }
  const porPerfilCategorias = new Map<number, { id: number; nombre: string; slug: string }[]>();
  for (const c of categoriasFilas) {
    porPerfilCategorias.set(c.perfilId, [
      ...(porPerfilCategorias.get(c.perfilId) ?? []),
      { id: c.id, nombre: c.nombre, slug: c.slug },
    ]);
  }
  const verificados = new Set(verificadas.map((v) => v.perfilId));

  const desde = opciones.desde ?? null;

  const resultados: ActorResumen[] = filas.map((fila) => {
    const cats = porPerfilCategorias.get(fila.id) ?? [];
    const distancia =
      desde && fila.lat !== null && fila.lng !== null
        ? distanciaKm(desde, { lat: fila.lat, lng: fila.lng })
        : null;

    const { puntaje, motivo } = puntuar({
      distancia,
      pideCategoria: Boolean(intencion.categoriaId),
      categoriaCoincide: intencion.categoriaId
        ? cats.some((c) => c.id === intencion.categoriaId)
        : false,
      terminoCoincide: intencion.terminos.some(
        (t) =>
          fila.nombre.toLowerCase().includes(t) ||
          (fila.descripcion ?? "").toLowerCase().includes(t) ||
          cats.some((c) => c.nombre.toLowerCase().includes(t)),
      ),
      disponibleAhora: fila.disponibleAhora,
      pideHoy: intencion.disponibilidad === "hoy",
      reputacion: fila.reputacionPromedio ? Number(fila.reputacionPromedio) : null,
      conteo: fila.reputacionConteo,
      verificado: verificados.has(fila.id),
    });

    return {
      ...fila,
      roles: porPerfilRoles.get(fila.id) ?? [],
      categorias: cats,
      verificado: verificados.has(fila.id),
      distanciaKm: distancia,
      puntaje,
      motivo,
    };
  });

  resultados.sort((a, b) => b.puntaje - a.puntaje);
  return resultados.slice(0, limite);
}

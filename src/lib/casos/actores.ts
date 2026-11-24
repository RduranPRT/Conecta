import { and, desc, eq, exists, inArray, or, sql, type AnyColumn, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  categorias,
  coberturas,
  comunas,
  items,
  perfilCategorias,
  perfilRoles,
  perfiles,
  regiones,
  verificaciones,
  type RolActor,
} from "@/db/schema";
import { distanciaKm } from "@/lib/geo";
import { textoPara } from "@/lib/privacidad";
import { normalizar } from "@/lib/utils";

import { coberturaDe, textoPropioCoincide } from "./categorias";
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
  /** Sin sesión, los textos libres salen sin teléfonos, correos ni redes. */
  conSesion?: boolean;
};

/** Sin tildes ni mayúsculas: «mantencion electrica» encuentra «Mantención eléctrica». */
function sinTildes(columna: AnyColumn) {
  return sql`translate(lower(coalesce(${columna}, '')), 'áéíóúüñ', 'aeiouun')`;
}

/** Expresión que calza al inicio de una palabra: «pan» no es «compañía». */
function inicioDePalabra(termino: string) {
  return `\\m${normalizar(termino).replace(/[^a-z0-9]/g, "")}`;
}

function calza(columna: AnyColumn, patron: string) {
  return sql`${sinTildes(columna)} ~ ${patron}`;
}

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
  // Un rubro cubre todo lo que cuelga de él; un ítem, también a quien ofrece su
  // subgrupo completo (ver `coberturaEn`).
  const cobertura = intencion.categoriaId
    ? await coberturaDe(intencion.categoriaId)
    : { exactas: [], amplias: [] };
  const idsCategoria = [...cobertura.exactas, ...cobertura.amplias];
  const alternativas: SQL[] = [];
  if (idsCategoria.length) {
    alternativas.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(perfilCategorias)
          .where(
            and(
              eq(perfilCategorias.perfilId, perfiles.id),
              inArray(perfilCategorias.categoriaId, idsCategoria),
            ),
          ),
      ),
    );
  }
  for (const termino of intencion.terminos.filter((t) => /[a-z0-9]/i.test(t)).slice(0, 4)) {
    const patron = inicioDePalabra(termino);
    alternativas.push(calza(perfiles.nombre, patron));
    alternativas.push(calza(perfiles.descripcion, patron));
    // Lo que escribió en «Otro» también lo hace encontrable (S11).
    alternativas.push(textoPropioCoincide(sinTildes, patron));
    alternativas.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(perfilCategorias)
          .innerJoin(categorias, eq(categorias.id, perfilCategorias.categoriaId))
          .where(
            and(
              eq(perfilCategorias.perfilId, perfiles.id),
              calza(categorias.nombre, patron),
            ),
          ),
      ),
    );
    // Lo que vende o presta un perfil también lo hace encontrable:
    // «filtro de aceite» llega a la tienda que lo tiene en su catálogo.
    alternativas.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(items)
          .where(
            and(
              eq(items.perfilId, perfiles.id),
              eq(items.activo, true),
              or(calza(items.nombre, patron), calza(items.descripcion, patron)),
            ),
          ),
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
      .where(inArray(perfilCategorias.perfilId, ids))
      .orderBy(desc(perfilCategorias.principal)),
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
      categoriaCoincide: cats.some((c) => cobertura.exactas.includes(c.id)),
      categoriaAmplia: cats.some((c) => cobertura.amplias.includes(c.id)),
      terminoCoincide: intencion.terminos.some((t) =>
        [fila.nombre, fila.descripcion ?? "", ...cats.map((c) => c.nombre)].some((texto) =>
          normalizar(texto).includes(normalizar(t)),
        ),
      ),
      disponibleAhora: fila.disponibleAhora,
      pideHoy: intencion.disponibilidad === "hoy",
      reputacion: fila.reputacionPromedio ? Number(fila.reputacionPromedio) : null,
      conteo: fila.reputacionConteo,
      verificado: verificados.has(fila.id),
    });

    return {
      ...fila,
      nombre: textoPara(fila.nombre, opciones.conSesion ?? false),
      descripcion: textoPara(fila.descripcion, opciones.conSesion ?? false),
      direccion: textoPara(fila.direccion, opciones.conSesion ?? false),
      roles: porPerfilRoles.get(fila.id) ?? [],
      // Lo que calza con la búsqueda va primero: es lo que la tarjeta muestra.
      categorias: [...cats].sort(
        (a, b) => Number(idsCategoria.includes(b.id)) - Number(idsCategoria.includes(a.id)),
      ),
      verificado: verificados.has(fila.id),
      distanciaKm: distancia,
      puntaje,
      motivo,
    };
  });

  resultados.sort((a, b) => b.puntaje - a.puntaje);
  return resultados.slice(0, limite);
}

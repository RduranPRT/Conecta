import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  calificaciones,
  categorias,
  coberturas,
  comunas,
  items,
  operaciones,
  perfilCategorias,
  perfilRoles,
  perfiles,
  regiones,
  verificaciones,
  type RolActor,
} from "@/db/schema";
import { slugificar } from "@/lib/utils";

import { registrarEvento } from "./eventos";

async function slugLibre(base: string) {
  const raiz = slugificar(base) || "perfil";
  let candidato = raiz;
  let n = 1;
  // Bucle acotado: en la práctica termina en el primer o segundo intento.
  while (n < 50) {
    const existe = await db
      .select({ x: sql`1` })
      .from(perfiles)
      .where(eq(perfiles.slug, candidato))
      .limit(1);
    if (!existe.length) return candidato;
    n += 1;
    candidato = `${raiz}-${n}`;
  }
  return `${raiz}-${Date.now()}`;
}

/**
 * R1 · Alta e identidad.
 * Una identidad, varios roles: nunca se crean cuentas distintas para el mismo
 * usuario que además vende, produce o presta servicios.
 */
export async function crearPerfil(entrada: {
  usuarioId: string;
  nombre: string;
  roles: RolActor[];
  comunaId?: number | null;
  identificadorFiscal?: string | null;
  telefono?: string | null;
  descripcion?: string | null;
  direccion?: string | null;
  categoriaIds?: number[];
  radioKm?: number | null;
}) {
  const comuna = entrada.comunaId
    ? await db.query.comunas.findFirst({ where: eq(comunas.id, entrada.comunaId) })
    : null;

  const slug = await slugLibre(entrada.nombre);

  const perfil = await db.transaction(async (tx) => {
    const [creado] = await tx
      .insert(perfiles)
      .values({
        usuarioId: entrada.usuarioId,
        slug,
        nombre: entrada.nombre.trim(),
        descripcion: entrada.descripcion?.trim() || null,
        identificadorFiscal: entrada.identificadorFiscal?.trim() || null,
        telefono: entrada.telefono?.trim() || null,
        direccion: entrada.direccion?.trim() || null,
        comunaId: entrada.comunaId ?? null,
        // Sin geocodificación en el MVP: se parte del centro de la comuna y
        // el usuario puede ajustar el punto después.
        lat: comuna?.lat ?? null,
        lng: comuna?.lng ?? null,
        radioKm: entrada.radioKm ?? null,
      })
      .returning();

    const roles = entrada.roles.length ? entrada.roles : (["persona"] as RolActor[]);
    await tx
      .insert(perfilRoles)
      .values(roles.map((rol) => ({ perfilId: creado.id, rol })))
      .onConflictDoNothing();

    if (entrada.categoriaIds?.length) {
      await tx
        .insert(perfilCategorias)
        .values(
          entrada.categoriaIds.map((categoriaId, i) => ({
            perfilId: creado.id,
            categoriaId,
            principal: i === 0,
          })),
        )
        .onConflictDoNothing();
    }

    if (entrada.comunaId) {
      await tx
        .insert(coberturas)
        .values({ perfilId: creado.id, comunaId: entrada.comunaId })
        .onConflictDoNothing();
    }

    return creado;
  });

  await registrarEvento({
    tipo: "perfil.creado",
    entidad: "perfil",
    entidadId: perfil.id,
    actorPerfilId: perfil.id,
    datos: { roles: entrada.roles },
  });

  return perfil;
}

export async function actualizarPerfil(
  perfilId: number,
  cambios: Partial<{
    nombre: string;
    descripcion: string | null;
    telefono: string | null;
    correoPublico: string | null;
    sitioWeb: string | null;
    direccion: string | null;
    comunaId: number | null;
    radioKm: number | null;
    identificadorFiscal: string | null;
  }>,
) {
  const valores: Record<string, unknown> = { ...cambios, actualizadoEn: new Date() };

  if (cambios.comunaId) {
    const comuna = await db.query.comunas.findFirst({ where: eq(comunas.id, cambios.comunaId) });
    if (comuna) {
      valores.lat = comuna.lat;
      valores.lng = comuna.lng;
    }
  }

  await db.update(perfiles).set(valores).where(eq(perfiles.id, perfilId));

  await registrarEvento({
    tipo: "perfil.actualizado",
    entidad: "perfil",
    entidadId: perfilId,
    actorPerfilId: perfilId,
  });
}

export async function fijarRoles(perfilId: number, roles: RolActor[]) {
  const activos = roles.length ? roles : (["persona"] as RolActor[]);
  await db.transaction(async (tx) => {
    await tx.update(perfilRoles).set({ activo: false }).where(eq(perfilRoles.perfilId, perfilId));
    await tx
      .insert(perfilRoles)
      .values(activos.map((rol) => ({ perfilId, rol, activo: true })))
      .onConflictDoUpdate({
        target: [perfilRoles.perfilId, perfilRoles.rol],
        set: { activo: true },
      });
  });
}

export async function fijarCategorias(perfilId: number, categoriaIds: number[]) {
  await db.transaction(async (tx) => {
    await tx.delete(perfilCategorias).where(eq(perfilCategorias.perfilId, perfilId));
    if (categoriaIds.length) {
      await tx.insert(perfilCategorias).values(
        categoriaIds.map((categoriaId, i) => ({
          perfilId,
          categoriaId,
          principal: i === 0,
        })),
      );
    }
  });
}

export async function fijarCoberturas(perfilId: number, comunaIds: number[]) {
  await db.transaction(async (tx) => {
    await tx.delete(coberturas).where(eq(coberturas.perfilId, perfilId));
    if (comunaIds.length) {
      await tx.insert(coberturas).values(comunaIds.map((comunaId) => ({ perfilId, comunaId })));
    }
  });
}

/**
 * El cambio de disponibilidad es el ejemplo del prompt: una sola escritura que
 * el buscador, el mapa, el feed y el matching leen de inmediato porque todos
 * consultan la misma tabla.
 */
export async function fijarDisponibilidad(perfilId: number, disponible: boolean) {
  await db
    .update(perfiles)
    .set({
      disponibleAhora: disponible,
      disponibleHasta: disponible ? new Date(Date.now() + 8 * 3_600_000) : null,
      actualizadoEn: new Date(),
    })
    .where(eq(perfiles.id, perfilId));

  await registrarEvento({
    tipo: disponible ? "perfil.disponible" : "perfil.no_disponible",
    entidad: "perfil",
    entidadId: perfilId,
    actorPerfilId: perfilId,
  });
}

/** Ficha pública completa. */
export async function perfilPublico(slug: string) {
  const filas = await db
    .select({
      perfil: perfiles,
      comunaNombre: comunas.nombre,
      regionNombre: regiones.nombre,
    })
    .from(perfiles)
    .leftJoin(comunas, eq(comunas.id, perfiles.comunaId))
    .leftJoin(regiones, eq(regiones.id, comunas.regionId))
    .where(eq(perfiles.slug, slug))
    .limit(1);

  const fila = filas[0];
  if (!fila) return null;

  const perfilId = fila.perfil.id;

  const [roles, cats, cobertura, verificado, catalogo, resenas, trabajos] = await Promise.all([
    db
      .select({ rol: perfilRoles.rol })
      .from(perfilRoles)
      .where(and(eq(perfilRoles.perfilId, perfilId), eq(perfilRoles.activo, true))),
    db
      .select({ id: categorias.id, nombre: categorias.nombre, slug: categorias.slug })
      .from(perfilCategorias)
      .innerJoin(categorias, eq(categorias.id, perfilCategorias.categoriaId))
      .where(eq(perfilCategorias.perfilId, perfilId)),
    db
      .select({ id: comunas.id, nombre: comunas.nombre })
      .from(coberturas)
      .innerJoin(comunas, eq(comunas.id, coberturas.comunaId))
      .where(eq(coberturas.perfilId, perfilId)),
    db
      .select({ tipo: verificaciones.tipo, estado: verificaciones.estado })
      .from(verificaciones)
      .where(eq(verificaciones.perfilId, perfilId)),
    db
      .select()
      .from(items)
      .where(and(eq(items.perfilId, perfilId), eq(items.activo, true)))
      .limit(12),
    db
      .select({
        calificacion: calificaciones,
        autorNombre: perfiles.nombre,
        autorSlug: perfiles.slug,
      })
      .from(calificaciones)
      .innerJoin(perfiles, eq(perfiles.id, calificaciones.autorPerfilId))
      .where(eq(calificaciones.destinoPerfilId, perfilId))
      .orderBy(desc(calificaciones.creadoEn))
      .limit(8),
    db
      .select({ total: sql<number>`count(*)` })
      .from(operaciones)
      .where(eq(operaciones.proveedorPerfilId, perfilId)),
  ]);

  return {
    ...fila.perfil,
    comunaNombre: fila.comunaNombre,
    regionNombre: fila.regionNombre,
    roles: roles.map((r) => r.rol),
    categorias: cats,
    cobertura,
    verificaciones: verificado,
    catalogo,
    resenas,
    operacionesCompletadas: Number(trabajos[0]?.total ?? 0),
  };
}

export async function categoriasDisponibles() {
  return db.select().from(categorias).orderBy(categorias.orden, categorias.nombre);
}

export async function comunasActivas() {
  return db
    .select({
      id: comunas.id,
      nombre: comunas.nombre,
      lat: comunas.lat,
      lng: comunas.lng,
      regionNombre: regiones.nombre,
      activa: comunas.activa,
    })
    .from(comunas)
    .innerJoin(regiones, eq(regiones.id, comunas.regionId))
    .orderBy(desc(comunas.activa), comunas.nombre);
}

export async function categoriasPorId(ids: number[]) {
  if (!ids.length) return [];
  return db.select().from(categorias).where(inArray(categorias.id, ids));
}

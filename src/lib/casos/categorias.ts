import { cache } from "react";
import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  categoriaRubros,
  categorias,
  perfilCategorias,
  perfiles,
  solicitudesCategoria,
} from "@/db/schema";

import { registrarEvento } from "./eventos";

export type Especialidad = {
  id: number;
  slug: string;
  nombre: string;
  tipo: "servicio" | "producto" | "ambos";
  oficio: string | null;
  ejemplos: string | null;
  rubroId: number;
};

export type Rubro = {
  id: number;
  slug: string;
  nombre: string;
  icono: string | null;
  ejemplos: string | null;
  /** Propias y las que también se descubren desde aquí (`secundaria`). */
  especialidades: (Especialidad & { secundaria: boolean })[];
};

/**
 * Árbol rubro → especialidades. Una especialidad aparece bajo su rubro
 * principal y bajo cada rubro secundario, pero es siempre la misma fila:
 * elegirla desde cualquier ruta guarda el mismo id (C02 · sin duplicados).
 */
export const arbolDeRubros = cache(async (): Promise<Rubro[]> => {
  const [filas, secundarios] = await Promise.all([
    db.select().from(categorias).orderBy(asc(categorias.orden), asc(categorias.nombre)),
    db.select().from(categoriaRubros),
  ]);

  const rubros = filas.filter((c) => c.padreId === null);
  const especialidades = filas.filter((c) => c.padreId !== null);
  const porId = new Map(especialidades.map((e) => [e.id, e]));

  return rubros.map((r) => {
    const propias = especialidades
      .filter((e) => e.padreId === r.id)
      .map((e) => ({ ...aEspecialidad(e), secundaria: false }));
    const ajenas = secundarios
      .filter((s) => s.rubroId === r.id)
      .map((s) => porId.get(s.categoriaId))
      .filter((e): e is NonNullable<typeof e> => Boolean(e))
      .map((e) => ({ ...aEspecialidad(e), secundaria: true }));
    return {
      id: r.id,
      slug: r.slug,
      nombre: r.nombre,
      icono: r.icono,
      ejemplos: r.ejemplos,
      especialidades: [...propias, ...ajenas].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    };
  });
});

function aEspecialidad(c: typeof categorias.$inferSelect): Especialidad {
  return {
    id: c.id,
    slug: c.slug,
    nombre: c.nombre,
    tipo: c.tipo,
    oficio: c.oficio,
    ejemplos: c.ejemplos,
    rubroId: c.padreId!,
  };
}

/**
 * Ids que cubre una categoría al buscar: una especialidad se cubre a sí misma;
 * un rubro cubre sus especialidades propias y las que también se descubren
 * desde él. Lo usan el buscador, el mapa y el matching por igual.
 */
export async function idsQueCubre(categoriaId: number): Promise<number[]> {
  const [categoria] = await db
    .select({ id: categorias.id, padreId: categorias.padreId })
    .from(categorias)
    .where(eq(categorias.id, categoriaId))
    .limit(1);
  if (!categoria) return [];
  if (categoria.padreId !== null) return [categoria.id];

  const [hijas, secundarias] = await Promise.all([
    db.select({ id: categorias.id }).from(categorias).where(eq(categorias.padreId, categoria.id)),
    db
      .select({ id: categoriaRubros.categoriaId })
      .from(categoriaRubros)
      .where(eq(categoriaRubros.rubroId, categoria.id)),
  ]);
  return [...new Set([categoria.id, ...hijas.map((h) => h.id), ...secundarias.map((s) => s.id)])];
}

/** Un rubro con sus especialidades y cuántos perfiles ofrecen cada una. */
export async function rubroPorSlug(slug: string) {
  const arbol = await arbolDeRubros();
  const rubro = arbol.find((r) => r.slug === slug);
  if (!rubro) return null;

  const ids = rubro.especialidades.map((e) => e.id);
  const conteos = ids.length
    ? await db
        .select({
          categoriaId: perfilCategorias.categoriaId,
          total: sql<number>`count(*)::int`,
        })
        .from(perfilCategorias)
        .where(inArray(perfilCategorias.categoriaId, ids))
        .groupBy(perfilCategorias.categoriaId)
    : [];
  const porId = new Map(conteos.map((c) => [c.categoriaId, Number(c.total)]));

  return {
    ...rubro,
    especialidades: rubro.especialidades.map((e) => ({ ...e, perfiles: porId.get(e.id) ?? 0 })),
  };
}

/** Rubros con el total de perfiles que ofrecen algo dentro de cada uno. */
export async function rubrosConOferta() {
  const arbol = await arbolDeRubros();
  const conteos = await db
    .select({ categoriaId: perfilCategorias.categoriaId, perfilId: perfilCategorias.perfilId })
    .from(perfilCategorias);

  return arbol.map((r) => {
    const ids = new Set(r.especialidades.map((e) => e.id));
    const perfilesUnicos = new Set(
      conteos.filter((c) => ids.has(c.categoriaId)).map((c) => c.perfilId),
    );
    return { ...r, perfiles: perfilesUnicos.size };
  });
}

/* ── «Otro»: actividades que no están en la taxonomía ───────────────────── */

export async function solicitarCategoria(entrada: {
  perfilId: number;
  texto: string;
  rubroId?: number | null;
}) {
  const texto = entrada.texto.trim().slice(0, 140);
  if (texto.length < 3) throw new Error("Describe tu actividad en al menos tres letras.");

  const [solicitud] = await db
    .insert(solicitudesCategoria)
    .values({ perfilId: entrada.perfilId, texto, rubroId: entrada.rubroId ?? null })
    .returning();

  await registrarEvento({
    tipo: "categoria.solicitada",
    entidad: "solicitud_categoria",
    entidadId: solicitud.id,
    actorPerfilId: entrada.perfilId,
    datos: { texto },
  });

  return solicitud;
}

/** Actividades «Otro» de un perfil que aún no tienen categoría asignada. */
export async function actividadesPropias(perfilId: number) {
  return db
    .select({ id: solicitudesCategoria.id, texto: solicitudesCategoria.texto })
    .from(solicitudesCategoria)
    .where(
      and(
        eq(solicitudesCategoria.perfilId, perfilId),
        eq(solicitudesCategoria.estado, "pendiente"),
      ),
    )
    .orderBy(asc(solicitudesCategoria.creadoEn));
}

/** Reemplaza las actividades «Otro» pendientes del perfil por las que vienen. */
export async function fijarActividadesPropias(perfilId: number, textos: string[]) {
  const actuales = await actividadesPropias(perfilId);
  const nuevos = textos.map((t) => t.trim()).filter((t) => t.length >= 3);
  const quitar = actuales.filter((a) => !nuevos.includes(a.texto));
  const agregar = nuevos.filter((t) => !actuales.some((a) => a.texto === t));

  if (quitar.length) {
    await db
      .update(solicitudesCategoria)
      .set({ estado: "descartada", resueltoEn: new Date() })
      .where(inArray(solicitudesCategoria.id, quitar.map((q) => q.id)));
  }
  for (const texto of agregar) await solicitarCategoria({ perfilId, texto });
}

/** Cola del Centro de Control. */
export async function solicitudesPendientes() {
  return db
    .select({
      solicitud: solicitudesCategoria,
      perfilNombre: perfiles.nombre,
      perfilSlug: perfiles.slug,
    })
    .from(solicitudesCategoria)
    .innerJoin(perfiles, eq(perfiles.id, solicitudesCategoria.perfilId))
    .where(eq(solicitudesCategoria.estado, "pendiente"))
    .orderBy(desc(solicitudesCategoria.creadoEn))
    .limit(50);
}

/**
 * El equipo resuelve una solicitud: la asigna a una especialidad existente
 * (el perfil pasa a aparecer en esas búsquedas) o la descarta.
 */
export async function resolverSolicitudCategoria(entrada: {
  solicitudId: number;
  categoriaId: number | null;
}) {
  const solicitud = await db.query.solicitudesCategoria.findFirst({
    where: eq(solicitudesCategoria.id, entrada.solicitudId),
  });
  if (!solicitud || solicitud.estado !== "pendiente") {
    throw new Error("La solicitud ya fue resuelta.");
  }

  if (entrada.categoriaId) {
    const especialidad = await db.query.categorias.findFirst({
      where: and(eq(categorias.id, entrada.categoriaId), isNotNull(categorias.padreId)),
    });
    if (!especialidad) throw new Error("Elige una especialidad, no un rubro.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(solicitudesCategoria)
      .set({
        estado: entrada.categoriaId ? "asignada" : "descartada",
        categoriaAsignadaId: entrada.categoriaId,
        resueltoEn: new Date(),
      })
      .where(eq(solicitudesCategoria.id, solicitud.id));
    if (entrada.categoriaId) {
      await tx
        .insert(perfilCategorias)
        .values({ perfilId: solicitud.perfilId, categoriaId: entrada.categoriaId })
        .onConflictDoNothing();
    }
  });

  await registrarEvento({
    tipo: entrada.categoriaId ? "categoria.asignada" : "categoria.descartada",
    entidad: "solicitud_categoria",
    entidadId: solicitud.id,
    actorPerfilId: null,
    datos: { categoriaId: entrada.categoriaId, perfilId: solicitud.perfilId },
  });
}

/** Solo especialidades válidas (no rubros): lo que un perfil puede declarar. */
export async function filtrarEspecialidades(ids: number[]) {
  if (!ids.length) return [];
  const filas = await db
    .select({ id: categorias.id })
    .from(categorias)
    .where(and(inArray(categorias.id, ids), isNotNull(categorias.padreId)));
  const validas = new Set(filas.map((f) => f.id));
  return ids.filter((id) => validas.has(id));
}

/** Rubros sueltos (sin padre): útil para validar entradas. */
export async function esRubro(categoriaId: number) {
  const fila = await db.query.categorias.findFirst({
    where: and(eq(categorias.id, categoriaId), isNull(categorias.padreId)),
  });
  return Boolean(fila);
}

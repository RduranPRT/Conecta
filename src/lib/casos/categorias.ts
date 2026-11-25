import { cache } from "react";
import { and, asc, desc, eq, exists, inArray, ne, sql, type AnyColumn, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  categoriaPadres,
  categorias,
  perfilCategorias,
  perfiles,
  perfilIntereses,
  solicitudesCategoria,
} from "@/db/schema";
import { coberturaEn, type NodoTaxonomia } from "@/lib/taxonomia";
import { normalizar, slugificar } from "@/lib/utils";

import { registrarEvento } from "./eventos";

export type Hoja = {
  id: number;
  slug: string;
  nombre: string;
  nivel: "item" | "oficio";
  tipo: "servicio" | "producto" | "ambos";
  sinonimos: string[];
  /** También cuelga de aquí, aunque su lugar principal sea otro. */
  secundaria: boolean;
};

export type Subgrupo = {
  id: number;
  slug: string;
  nombre: string;
  tipo: "servicio" | "producto" | "ambos";
  ejemplos: string | null;
  sinonimos: string[];
  secundaria: boolean;
  items: Hoja[];
  oficios: Hoja[];
};

export type Rubro = {
  id: number;
  slug: string;
  nombre: string;
  icono: string | null;
  ejemplos: string | null;
  subgrupos: Subgrupo[];
};

/** Todas las filas con todos sus padres. Una consulta por petición. */
const nodos = cache(async () => {
  const [filas, aristas] = await Promise.all([
    db.select().from(categorias).orderBy(asc(categorias.orden), asc(categorias.nombre)),
    db.select().from(categoriaPadres),
  ]);
  const padres = new Map<number, number[]>();
  for (const a of aristas) {
    padres.set(a.categoriaId, [...(padres.get(a.categoriaId) ?? []), a.padreId]);
  }
  return { filas, padres };
});

const porNombre = (a: { nombre: string }, b: { nombre: string }) =>
  a.nombre.localeCompare(b.nombre, "es");

/**
 * Árbol rubro → subgrupo → ítems y oficios. Un elemento aparece bajo cada uno
 * de sus padres, pero es siempre la misma fila: elegirlo desde cualquier ruta
 * guarda el mismo id (C02 · sin duplicados).
 */
export const arbolDeRubros = cache(async (): Promise<Rubro[]> => {
  const { filas, padres } = await nodos();
  const hijosDe = new Map<number, (typeof filas)[number][]>();
  for (const f of filas) {
    for (const p of padres.get(f.id) ?? []) hijosDe.set(p, [...(hijosDe.get(p) ?? []), f]);
  }

  return filas
    .filter((f) => f.nivel === "rubro")
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      nombre: r.nombre,
      icono: r.icono,
      ejemplos: r.ejemplos,
      subgrupos: (hijosDe.get(r.id) ?? [])
        .filter((s) => s.nivel === "subgrupo")
        .map((s) => {
          const hojas = (hijosDe.get(s.id) ?? []).map((h) => ({
            id: h.id,
            slug: h.slug,
            nombre: h.nombre,
            nivel: h.nivel as "item" | "oficio",
            tipo: h.tipo,
            sinonimos: h.sinonimos,
            secundaria: h.padreId !== s.id,
          }));
          return {
            id: s.id,
            slug: s.slug,
            nombre: s.nombre,
            tipo: s.tipo,
            ejemplos: s.ejemplos,
            sinonimos: s.sinonimos,
            secundaria: s.padreId !== r.id,
            items: hojas.filter((h) => h.nivel === "item").sort(porNombre),
            oficios: hojas.filter((h) => h.nivel === "oficio").sort(porNombre),
          };
        })
        .sort(porNombre),
    }));
});

/**
 * Qué perfiles calzan con una categoría: `exactas` la declararon; `amplias`
 * declararon algo que la incluye (el subgrupo completo, el oficio). Lo usan el
 * buscador, el mapa y el matching por igual.
 */
export async function coberturaDe(categoriaId: number) {
  const { filas, padres } = await nodos();
  const lista: NodoTaxonomia[] = filas.map((f) => ({
    id: f.id,
    nivel: f.nivel,
    tipo: f.tipo,
    padres: padres.get(f.id) ?? [],
  }));
  return coberturaEn(lista, categoriaId);
}

/** Todos los ids que cubre una categoría, sin distinguir. */
export async function idsQueCubre(categoriaId: number): Promise<number[]> {
  const { exactas, amplias } = await coberturaDe(categoriaId);
  return [...exactas, ...amplias];
}

/** Devuelve una función que cuenta los perfiles que ofrecen una categoría. */
async function contadorDePerfiles() {
  const filas = await db
    .select({ categoriaId: perfilCategorias.categoriaId, perfilId: perfilCategorias.perfilId })
    .from(perfilCategorias);
  const porCategoria = new Map<number, Set<number>>();
  for (const f of filas) {
    if (!porCategoria.has(f.categoriaId)) porCategoria.set(f.categoriaId, new Set());
    porCategoria.get(f.categoriaId)!.add(f.perfilId);
  }
  return async (categoriaId: number) => {
    const { exactas, amplias } = await coberturaDe(categoriaId);
    const perfilesUnicos = new Set<number>();
    for (const id of [...exactas, ...amplias]) {
      for (const p of porCategoria.get(id) ?? []) perfilesUnicos.add(p);
    }
    return perfilesUnicos.size;
  };
}

/** Un rubro con sus subgrupos, ítems y cuántos perfiles ofrecen cada cosa. */
export async function rubroPorSlug(slug: string) {
  const arbol = await arbolDeRubros();
  const rubro = arbol.find((r) => r.slug === slug);
  if (!rubro) return null;

  const contar = await contadorDePerfiles();
  const subgrupos = await Promise.all(
    rubro.subgrupos.map(async (s) => ({
      ...s,
      perfiles: await contar(s.id),
      items: await Promise.all(
        s.items.map(async (i) => ({ ...i, perfiles: await contar(i.id) })),
      ),
    })),
  );
  return { ...rubro, subgrupos };
}

/** Rubros con el total de perfiles que ofrecen algo dentro de cada uno. */
export async function rubrosConOferta() {
  const arbol = await arbolDeRubros();
  const contar = await contadorDePerfiles();
  return Promise.all(arbol.map(async (r) => ({ ...r, perfiles: await contar(r.id) })));
}

/** Solo lo que un perfil puede declarar u ofrecer: subgrupo, ítem u oficio. */
export async function filtrarActividades(ids: number[]) {
  if (!ids.length) return [];
  const filas = await db
    .select({ id: categorias.id })
    .from(categorias)
    .where(and(inArray(categorias.id, ids), ne(categorias.nivel, "rubro")));
  const validas = new Set(filas.map((f) => f.id));
  return ids.filter((id) => validas.has(id));
}

/* ── Intereses (S19) ─────────────────────────────────────────────────────── */

export async function interesesDe(perfilId: number) {
  const filas = await db
    .select({ id: perfilIntereses.categoriaId })
    .from(perfilIntereses)
    .where(eq(perfilIntereses.perfilId, perfilId));
  return filas.map((f) => f.id);
}

/** Reemplaza los intereses. Solo rubros: es una preferencia, no una oferta. */
export async function fijarIntereses(perfilId: number, ids: number[]) {
  const validos = ids.length
    ? await db
        .select({ id: categorias.id })
        .from(categorias)
        .where(and(inArray(categorias.id, ids), eq(categorias.nivel, "rubro")))
    : [];
  await db.transaction(async (tx) => {
    await tx.delete(perfilIntereses).where(eq(perfilIntereses.perfilId, perfilId));
    if (validos.length) {
      await tx
        .insert(perfilIntereses)
        .values(validos.map((v) => ({ perfilId, categoriaId: v.id })))
        .onConflictDoNothing();
    }
  });
}

/** Todo lo que cubren los rubros de interés de un perfil. */
export async function categoriasDeInteres(perfilId: number) {
  const rubros = await interesesDe(perfilId);
  const cubiertas = await Promise.all(rubros.map((id) => idsQueCubre(id)));
  return new Set(cubiertas.flat());
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
      .set({ estado: "rechazada", resueltoEn: new Date() })
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
 * Crea un ítem en la taxonomía desde administración. El slug sale del nombre
 * normalizado y es único: si ya existe, se usa el que hay (S17).
 */
export async function crearItemTaxonomia(entrada: {
  nombre: string;
  tipo: "servicio" | "producto";
  subgrupoId: number;
}) {
  const nombre = entrada.nombre.trim().replace(/\s+/g, " ").slice(0, 80);
  const raiz = slugificar(nombre);
  if (raiz.length < 3) throw new Error("Escribe un nombre para el ítem.");
  const subgrupo = await db.query.categorias.findFirst({
    where: and(eq(categorias.id, entrada.subgrupoId), eq(categorias.nivel, "subgrupo")),
  });
  if (!subgrupo) throw new Error("Elige el subgrupo donde va el ítem.");

  const slug = `item-${raiz}`;
  return db.transaction(async (tx) => {
    const [creado] = await tx
      .insert(categorias)
      .values({
        slug,
        nombre,
        tipo: entrada.tipo,
        nivel: "item",
        origen: "admin",
        padreId: subgrupo.id,
        sinonimos: [],
        orden: 9000,
      })
      .onConflictDoNothing({ target: categorias.slug })
      .returning();
    const item =
      creado ?? (await tx.query.categorias.findFirst({ where: eq(categorias.slug, slug) }))!;
    await tx
      .insert(categoriaPadres)
      .values({ categoriaId: item.id, padreId: subgrupo.id })
      .onConflictDoNothing();
    return { item, nuevo: Boolean(creado) };
  });
}

export type DecisionSolicitud =
  | { tipo: "aprobar"; nombre: string; clase: "servicio" | "producto"; subgrupoId: number }
  | { tipo: "fusionar"; categoriaId: number }
  | { tipo: "rechazar" };

/**
 * El equipo resuelve una actividad «Otro»: crea el ítem, la une a uno que ya
 * existe o la rechaza. El perfil queda reasignado solo, y con él todos los que
 * escribieron lo mismo: nadie tiene que repetir la decisión.
 */
export async function resolverSolicitudCategoria(entrada: {
  solicitudId: number;
  decision: DecisionSolicitud;
}) {
  const solicitud = await db.query.solicitudesCategoria.findFirst({
    where: eq(solicitudesCategoria.id, entrada.solicitudId),
  });
  if (!solicitud || solicitud.estado !== "pendiente") {
    throw new Error("La solicitud ya fue resuelta.");
  }

  const { decision } = entrada;
  let categoriaId: number | null = null;
  let estado: "aprobada" | "fusionada" | "rechazada" = "rechazada";

  if (decision.tipo === "aprobar") {
    const { item, nuevo } = await crearItemTaxonomia({
      nombre: decision.nombre,
      tipo: decision.clase,
      subgrupoId: decision.subgrupoId,
    });
    categoriaId = item.id;
    estado = nuevo ? "aprobada" : "fusionada";
  } else if (decision.tipo === "fusionar") {
    const [valida] = await filtrarActividades([decision.categoriaId]);
    if (!valida) throw new Error("Elige un ítem, un oficio o un subgrupo.");
    categoriaId = valida;
    estado = "fusionada";
  }

  // Rechazar es solo para esta persona; aprobar o fusionar vale para todas las
  // que escribieron lo mismo.
  const pendientes = categoriaId
    ? (
        await db
          .select()
          .from(solicitudesCategoria)
          .where(eq(solicitudesCategoria.estado, "pendiente"))
      ).filter((s) => normalizar(s.texto) === normalizar(solicitud.texto))
    : [solicitud];

  await db.transaction(async (tx) => {
    await tx
      .update(solicitudesCategoria)
      .set({ estado, categoriaAsignadaId: categoriaId, resueltoEn: new Date() })
      .where(inArray(solicitudesCategoria.id, pendientes.map((p) => p.id)));
    if (categoriaId) {
      await tx
        .insert(perfilCategorias)
        .values(pendientes.map((p) => ({ perfilId: p.perfilId, categoriaId: categoriaId! })))
        .onConflictDoNothing();
    }
  });

  for (const p of pendientes) {
    await registrarEvento({
      tipo: `categoria.${estado}`,
      entidad: "solicitud_categoria",
      entidadId: p.id,
      actorPerfilId: null,
      datos: { categoriaId, perfilId: p.perfilId, texto: p.texto },
    });
  }

  return { estado, categoriaId, perfiles: pendientes.length };
}

/** Nombres y sinónimos para sugerir algo parecido (S12). */
export async function buscables() {
  const { filas } = await nodos();
  return filas.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    nivel: f.nivel,
    sinonimos: f.sinonimos,
  }));
}

/** El perfil escribió algo así en «Otro» y sigue pendiente. */
export function textoPropioCoincide(sinTildes: (columna: AnyColumn) => SQL, patron: string) {
  return exists(
    db
      .select({ x: sql`1` })
      .from(solicitudesCategoria)
      .where(
        and(
          eq(solicitudesCategoria.perfilId, perfiles.id),
          eq(solicitudesCategoria.estado, "pendiente"),
          sql`${sinTildes(solicitudesCategoria.texto)} ~ ${patron}`,
        ),
      ),
  );
}

/** Lista plana para elegir una sola categoría. Cada cosa aparece una vez. */
export async function opcionesCategoria() {
  const { filas } = await nodos();
  const nombre = new Map(filas.map((f) => [f.id, f.nombre]));
  return filas.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    nivel: f.nivel,
    en: f.padreId ? (nombre.get(f.padreId) ?? "") : "",
    alias: f.sinonimos,
  }));
}

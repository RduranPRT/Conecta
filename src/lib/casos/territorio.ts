import { cache } from "react";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { comunas, paises, regiones } from "@/db/schema";

export type OpcionRegion = { id: number; nombre: string };
export type OpcionComunaTerritorio = {
  id: number;
  nombre: string;
  regionId: number;
  regionNombre: string;
  activa: boolean;
};

/**
 * Catálogo territorial único: lo usan el registro, Mi perfil, Publicar, el
 * mapa y los filtros de búsqueda. País → región → comuna.
 */
export const opcionesTerritorio = cache(async () => {
  const filas = await db
    .select({
      id: comunas.id,
      nombre: comunas.nombre,
      regionId: regiones.id,
      regionNombre: regiones.nombre,
      regionOrden: regiones.orden,
      activa: comunas.activa,
    })
    .from(comunas)
    .innerJoin(regiones, eq(regiones.id, comunas.regionId))
    .orderBy(asc(regiones.orden), asc(comunas.nombre));

  const vistas = new Set<number>();
  const listaRegiones: OpcionRegion[] = [];
  for (const f of filas) {
    if (!vistas.has(f.regionId)) {
      vistas.add(f.regionId);
      listaRegiones.push({ id: f.regionId, nombre: f.regionNombre });
    }
  }

  return {
    regiones: listaRegiones,
    comunas: filas.map(({ regionOrden: _orden, ...c }) => c) as OpcionComunaTerritorio[],
  };
});

/** Nombre de la comuna con su región, para decir qué territorio se está viendo. */
export async function ubicacionDeComuna(comunaId: number | null | undefined) {
  if (!comunaId) return null;
  const [fila] = await db
    .select({
      id: comunas.id,
      nombre: comunas.nombre,
      activa: comunas.activa,
      lat: comunas.lat,
      lng: comunas.lng,
      regionNombre: regiones.nombre,
    })
    .from(comunas)
    .innerJoin(regiones, eq(regiones.id, comunas.regionId))
    .where(eq(comunas.id, comunaId))
    .limit(1);
  return fila ?? null;
}

/** undefined = no eligió; null = eligió «todo Chile». */
export type ComunaElegida = number | null | undefined;

export type TerritorioExplorado = {
  comuna: NonNullable<Awaited<ReturnType<typeof ubicacionDeComuna>>> | null;
  /** `explicito`: la persona lo pidió, así que filtra. Si no, solo ordena. */
  explicito: boolean;
};

/**
 * Única regla para saber qué territorio se explora (S20): lo que dice la URL,
 * luego lo que la persona eligió, luego su comuna y al final la comuna piloto.
 */
export async function territorioExplorado(entrada: {
  url?: number;
  guardada: ComunaElegida;
  perfil?: number;
}): Promise<TerritorioExplorado> {
  if (entrada.url) {
    const comuna = await ubicacionDeComuna(entrada.url);
    if (comuna) return { comuna, explicito: true };
  }
  if (entrada.guardada === null) return { comuna: null, explicito: true };
  if (entrada.guardada) {
    const comuna = await ubicacionDeComuna(entrada.guardada);
    if (comuna) return { comuna, explicito: true };
  }
  if (entrada.perfil) {
    const comuna = await ubicacionDeComuna(entrada.perfil);
    if (comuna) return { comuna, explicito: false };
  }
  return { comuna: await comunaPiloto(), explicito: false };
}

/** Prefijo telefónico del país de una comuna (o el del primer país activo). */
export async function prefijoTelefonico(comunaId?: number | null) {
  if (comunaId) {
    const [fila] = await db
      .select({ prefijo: paises.prefijoTelefono })
      .from(comunas)
      .innerJoin(regiones, eq(regiones.id, comunas.regionId))
      .innerJoin(paises, eq(paises.id, regiones.paisId))
      .where(eq(comunas.id, comunaId))
      .limit(1);
    if (fila?.prefijo) return fila.prefijo;
  }
  const [pais] = await db
    .select({ prefijo: paises.prefijoTelefono })
    .from(paises)
    .where(eq(paises.activo, true))
    .limit(1);
  return pais?.prefijo ?? "+56";
}

/** Comuna piloto: donde la plataforma arrancó y hay más oferta. */
export async function comunaPiloto() {
  const [fila] = await db
    .select({ id: comunas.id })
    .from(comunas)
    .where(eq(comunas.activa, true))
    .limit(1);
  return fila ? ubicacionDeComuna(fila.id) : null;
}

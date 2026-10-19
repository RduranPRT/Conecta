import { cache } from "react";
import { asc, eq, isNotNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { comunas, paises, perfiles, regiones } from "@/db/schema";

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

/** Comunas donde ya hay al menos un perfil: lo que de verdad tiene oferta hoy. */
export async function comunasConActividad() {
  const [fila] = await db
    .select({ total: sql<number>`count(distinct ${perfiles.comunaId})::int` })
    .from(perfiles)
    .where(isNotNull(perfiles.comunaId));
  return Number(fila?.total ?? 0);
}

/** Comuna piloto: donde la plataforma arrancó y hay más oferta. */
export async function comunaPiloto() {
  const [fila] = await db
    .select({ id: comunas.id, nombre: comunas.nombre, lat: comunas.lat, lng: comunas.lng })
    .from(comunas)
    .where(eq(comunas.activa, true))
    .limit(1);
  return fila ?? null;
}

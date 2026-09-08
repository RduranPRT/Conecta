import { and, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  categorias,
  comunas,
  guardados,
  necesidades,
  perfilCategorias,
  perfiles,
  publicaciones,
  reacciones,
  seguimientos,
} from "@/db/schema";

import { registrarEvento } from "./eventos";

export type FiltrosFeed = {
  perfilId?: number | null;
  comunaId?: number | null;
  categoriaId?: number | null;
  tipo?: (typeof publicaciones.tipo.enumValues)[number] | null;
  /** false = explorar fuera de la zona habitual. */
  soloMiZona?: boolean;
  limite?: number;
};

/**
 * Feed personalizado por territorio, intereses y comportamiento.
 *
 * La personalización es explicable a propósito: cada publicación lleva por qué
 * está ahí. Los contenidos patrocinados suben, pero nunca desplazan del todo a
 * los orgánicos —van intercalados y marcados.
 */
export async function feedPara(filtros: FiltrosFeed) {
  const limite = filtros.limite ?? 30;
  const condiciones: SQL[] = [eq(publicaciones.estado, "publicada")];

  if (filtros.tipo) condiciones.push(eq(publicaciones.tipo, filtros.tipo));
  if (filtros.categoriaId) condiciones.push(eq(publicaciones.categoriaId, filtros.categoriaId));
  if (filtros.soloMiZona && filtros.comunaId) {
    condiciones.push(eq(publicaciones.comunaId, filtros.comunaId));
  }

  const interesesRaw = filtros.perfilId
    ? await db
        .select({ categoriaId: perfilCategorias.categoriaId })
        .from(perfilCategorias)
        .where(eq(perfilCategorias.perfilId, filtros.perfilId))
    : [];
  const intereses = interesesRaw.map((i) => i.categoriaId);

  const seguidosRaw = filtros.perfilId
    ? await db
        .select({ perfilId: seguimientos.seguidoPerfilId })
        .from(seguimientos)
        .where(eq(seguimientos.seguidorPerfilId, filtros.perfilId))
    : [];
  const seguidos = seguidosRaw.map((s) => s.perfilId);

  const filas = await db
    .select({
      publicacion: publicaciones,
      autorNombre: perfiles.nombre,
      autorSlug: perfiles.slug,
      autorAvatar: perfiles.avatarUrl,
      autorDisponible: perfiles.disponibleAhora,
      autorReputacion: perfiles.reputacionPromedio,
      comunaNombre: comunas.nombre,
      categoriaNombre: categorias.nombre,
      necesidadEstado: necesidades.estado,
      reacciones: sql<number>`(
        select count(*) from ${reacciones}
        where ${reacciones.publicacionId} = ${publicaciones.id}
      )`.as("reacciones"),
      reaccionada: filtros.perfilId
        ? sql<boolean>`exists (
            select 1 from ${reacciones}
            where ${reacciones.publicacionId} = ${publicaciones.id}
              and ${reacciones.perfilId} = ${filtros.perfilId}
          )`.as("reaccionada")
        : sql<boolean>`false`.as("reaccionada"),
      guardada: filtros.perfilId
        ? sql<boolean>`exists (
            select 1 from ${guardados}
            where ${guardados.publicacionId} = ${publicaciones.id}
              and ${guardados.perfilId} = ${filtros.perfilId}
          )`.as("guardada")
        : sql<boolean>`false`.as("guardada"),
    })
    .from(publicaciones)
    .innerJoin(perfiles, eq(perfiles.id, publicaciones.autorPerfilId))
    .leftJoin(comunas, eq(comunas.id, publicaciones.comunaId))
    .leftJoin(categorias, eq(categorias.id, publicaciones.categoriaId))
    .leftJoin(necesidades, eq(necesidades.id, publicaciones.necesidadId))
    .where(and(...condiciones))
    .orderBy(desc(publicaciones.creadoEn))
    .limit(120);

  const ahora = Date.now();

  const puntuadas = filas.map((fila) => {
    const razones: string[] = [];
    let puntaje = 0;

    // Temporalidad: media vida de 48 horas.
    const horas = (ahora - new Date(fila.publicacion.creadoEn).getTime()) / 3_600_000;
    puntaje += Math.max(0, 1 - horas / 48) * 0.35;

    if (filtros.comunaId && fila.publicacion.comunaId === filtros.comunaId) {
      puntaje += 0.25;
      razones.push("en tu comuna");
    }
    if (fila.publicacion.categoriaId && intereses.includes(fila.publicacion.categoriaId)) {
      puntaje += 0.2;
      razones.push("de tu rubro");
    }
    if (seguidos.includes(fila.publicacion.autorPerfilId)) {
      puntaje += 0.15;
      razones.push("de alguien que sigues");
    }
    if (fila.publicacion.tipo === "necesidad" && fila.necesidadEstado === "publicada") {
      puntaje += 0.1;
      razones.push("necesidad abierta");
    }
    if (fila.autorDisponible) puntaje += 0.05;

    const patrocinioVigente =
      fila.publicacion.patrocinado &&
      (!fila.publicacion.patrocinioHasta ||
        new Date(fila.publicacion.patrocinioHasta).getTime() > ahora);

    if (patrocinioVigente) puntaje += 0.3;

    return {
      ...fila,
      patrocinado: Boolean(patrocinioVigente),
      motivo: razones.join(" · ") || "reciente en tu territorio",
      puntaje,
    };
  });

  puntuadas.sort((a, b) => b.puntaje - a.puntaje);

  // Los patrocinados no pueden copar el inicio del feed: máximo uno cada cuatro.
  const organicas = puntuadas.filter((p) => !p.patrocinado);
  const pagadas = puntuadas.filter((p) => p.patrocinado);
  const mezcladas: typeof puntuadas = [];
  let i = 0;
  let j = 0;
  while (mezcladas.length < limite && (i < organicas.length || j < pagadas.length)) {
    if (mezcladas.length > 0 && mezcladas.length % 4 === 3 && j < pagadas.length) {
      mezcladas.push(pagadas[j++]);
    } else if (i < organicas.length) {
      mezcladas.push(organicas[i++]);
    } else if (j < pagadas.length) {
      mezcladas.push(pagadas[j++]);
    } else break;
  }

  return mezcladas;
}

export type PublicacionFeed = Awaited<ReturnType<typeof feedPara>>[number];

export async function crearPublicacion(entrada: {
  autorPerfilId: number;
  tipo: (typeof publicaciones.tipo.enumValues)[number];
  titulo: string;
  cuerpo?: string | null;
  categoriaId?: number | null;
  comunaId?: number | null;
  precio?: number | null;
  moneda?: string;
}) {
  const [fila] = await db
    .insert(publicaciones)
    .values({
      autorPerfilId: entrada.autorPerfilId,
      tipo: entrada.tipo,
      titulo: entrada.titulo.trim(),
      cuerpo: entrada.cuerpo?.trim() || null,
      categoriaId: entrada.categoriaId ?? null,
      comunaId: entrada.comunaId ?? null,
      precio: entrada.precio?.toString() ?? null,
      moneda: entrada.moneda ?? "CLP",
    })
    .returning();

  await registrarEvento({
    tipo: "publicacion.creada",
    entidad: "publicacion",
    entidadId: fila.id,
    actorPerfilId: entrada.autorPerfilId,
    datos: { tipo: entrada.tipo },
  });

  return fila;
}

export async function alternarReaccion(publicacionId: number, perfilId: number) {
  const existente = await db
    .select({ x: sql`1` })
    .from(reacciones)
    .where(and(eq(reacciones.publicacionId, publicacionId), eq(reacciones.perfilId, perfilId)))
    .limit(1);

  if (existente.length) {
    await db
      .delete(reacciones)
      .where(and(eq(reacciones.publicacionId, publicacionId), eq(reacciones.perfilId, perfilId)));
    return false;
  }

  await db.insert(reacciones).values({ publicacionId, perfilId });
  return true;
}

export async function alternarSeguimiento(seguidoPerfilId: number, seguidorPerfilId: number) {
  if (seguidoPerfilId === seguidorPerfilId) throw new Error("No puedes seguirte a ti mismo.");

  const existente = await db
    .select({ x: sql`1` })
    .from(seguimientos)
    .where(
      and(
        eq(seguimientos.seguidoPerfilId, seguidoPerfilId),
        eq(seguimientos.seguidorPerfilId, seguidorPerfilId),
      ),
    )
    .limit(1);

  if (existente.length) {
    await db
      .delete(seguimientos)
      .where(
        and(
          eq(seguimientos.seguidoPerfilId, seguidoPerfilId),
          eq(seguimientos.seguidorPerfilId, seguidorPerfilId),
        ),
      );
    return false;
  }

  await db.insert(seguimientos).values({ seguidoPerfilId, seguidorPerfilId });
  return true;
}

/** Publicaciones de un perfil, para su ficha pública. */
export async function publicacionesDe(perfilId: number, limite = 10) {
  return db
    .select({
      publicacion: publicaciones,
      categoriaNombre: categorias.nombre,
      comunaNombre: comunas.nombre,
    })
    .from(publicaciones)
    .leftJoin(categorias, eq(categorias.id, publicaciones.categoriaId))
    .leftJoin(comunas, eq(comunas.id, publicaciones.comunaId))
    .where(
      and(
        eq(publicaciones.autorPerfilId, perfilId),
        or(eq(publicaciones.estado, "publicada"), eq(publicaciones.estado, "pausada"))!,
      ),
    )
    .orderBy(desc(publicaciones.creadoEn))
    .limit(limite);
}

export async function categoriasPara(ids: number[]) {
  if (!ids.length) return [];
  return db.select().from(categorias).where(inArray(categorias.id, ids));
}

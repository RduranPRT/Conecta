import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { categorias, comunas, guardados, perfiles, publicaciones, reacciones } from "@/db/schema";

import { registrarEvento } from "./eventos";

/**
 * Guardados: "quiero volver a esto". Pedido por Álvaro junto con el resto de
 * la simplificación de navegación, como sección propia dentro de Mi Conecta.
 */
export async function estaGuardado(publicacionId: number, perfilId: number) {
  const fila = await db
    .select({ x: sql`1` })
    .from(guardados)
    .where(and(eq(guardados.publicacionId, publicacionId), eq(guardados.perfilId, perfilId)))
    .limit(1);
  return fila.length > 0;
}

export async function alternarGuardado(publicacionId: number, perfilId: number) {
  const existente = await db
    .select({ x: sql`1` })
    .from(guardados)
    .where(and(eq(guardados.publicacionId, publicacionId), eq(guardados.perfilId, perfilId)))
    .limit(1);

  if (existente.length) {
    await db
      .delete(guardados)
      .where(and(eq(guardados.publicacionId, publicacionId), eq(guardados.perfilId, perfilId)));
    return false;
  }

  await db.insert(guardados).values({ publicacionId, perfilId });
  await registrarEvento({
    tipo: "publicacion.guardada",
    entidad: "publicacion",
    entidadId: publicacionId,
    actorPerfilId: perfilId,
  });
  return true;
}

/** Lo que un perfil guardó, listo para pintarse con TarjetaPublicacion. */
export async function guardadosDe(perfilId: number, limite = 30) {
  const filas = await db
    .select({
      publicacion: publicaciones,
      autorNombre: perfiles.nombre,
      autorSlug: perfiles.slug,
      autorAvatar: perfiles.avatarUrl,
      comunaNombre: comunas.nombre,
      categoriaNombre: categorias.nombre,
      guardadoEn: guardados.creadoEn,
      reacciones: sql<number>`(
        select count(*) from ${reacciones}
        where ${reacciones.publicacionId} = ${publicaciones.id}
      )`.as("reacciones"),
      reaccionada: sql<boolean>`exists (
        select 1 from ${reacciones}
        where ${reacciones.publicacionId} = ${publicaciones.id}
          and ${reacciones.perfilId} = ${perfilId}
      )`.as("reaccionada"),
    })
    .from(guardados)
    .innerJoin(publicaciones, eq(publicaciones.id, guardados.publicacionId))
    .innerJoin(perfiles, eq(perfiles.id, publicaciones.autorPerfilId))
    .leftJoin(comunas, eq(comunas.id, publicaciones.comunaId))
    .leftJoin(categorias, eq(categorias.id, publicaciones.categoriaId))
    .where(eq(guardados.perfilId, perfilId))
    .orderBy(desc(guardados.creadoEn))
    .limit(limite);

  return filas;
}

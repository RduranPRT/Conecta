import { and, desc, eq, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  calificaciones,
  categorias,
  comunas,
  eventos,
  invitaciones,
  necesidades,
  operaciones,
  perfiles,
  propuestas,
} from "@/db/schema";

/**
 * Actividad y operaciones: lo que el usuario tiene abierto, en curso y cerrado.
 * La misma consulta sirve al panel de una persona y al de un negocio; cambia el
 * énfasis en la interfaz, no los datos.
 */
export async function actividadDe(perfilId: number) {
  const [misNecesidades, misPropuestas, misOperaciones, oportunidadesAbiertas] = await Promise.all([
    db
      .select({
        necesidad: necesidades,
        comunaNombre: comunas.nombre,
        categoriaNombre: categorias.nombre,
        propuestas: sql<number>`(
          select count(*) from ${propuestas}
          where ${propuestas.necesidadId} = ${necesidades.id}
            and ${propuestas.estado} <> 'retirada'
        )`.as("propuestas"),
      })
      .from(necesidades)
      .leftJoin(comunas, eq(comunas.id, necesidades.comunaId))
      .leftJoin(categorias, eq(categorias.id, necesidades.categoriaId))
      .where(eq(necesidades.solicitantePerfilId, perfilId))
      .orderBy(desc(necesidades.creadoEn))
      .limit(30),

    db
      .select({
        propuesta: propuestas,
        necesidad: necesidades,
        solicitanteNombre: perfiles.nombre,
      })
      .from(propuestas)
      .innerJoin(necesidades, eq(necesidades.id, propuestas.necesidadId))
      .innerJoin(perfiles, eq(perfiles.id, necesidades.solicitantePerfilId))
      .where(eq(propuestas.perfilId, perfilId))
      .orderBy(desc(propuestas.creadoEn))
      .limit(30),

    db
      .select({
        operacion: operaciones,
        necesidadTitulo: necesidades.titulo,
        contraparteNombre: sql<string>`(
          select p.nombre from perfiles p
          where p.id = case
            when ${operaciones.compradorPerfilId} = ${perfilId}
              then ${operaciones.proveedorPerfilId}
            else ${operaciones.compradorPerfilId} end
        )`.as("contraparte_nombre"),
        soyComprador: sql<boolean>`${operaciones.compradorPerfilId} = ${perfilId}`.as(
          "soy_comprador",
        ),
        yaCalifique: sql<boolean>`exists (
          select 1 from ${calificaciones}
          where ${calificaciones.operacionId} = ${operaciones.id}
            and ${calificaciones.autorPerfilId} = ${perfilId}
        )`.as("ya_califique"),
      })
      .from(operaciones)
      .innerJoin(necesidades, eq(necesidades.id, operaciones.necesidadId))
      .where(
        or(
          eq(operaciones.compradorPerfilId, perfilId),
          eq(operaciones.proveedorPerfilId, perfilId),
        ),
      )
      .orderBy(desc(operaciones.acordadaEn))
      .limit(30),

    db
      .select({ total: sql<number>`count(*)` })
      .from(invitaciones)
      .innerJoin(necesidades, eq(necesidades.id, invitaciones.necesidadId))
      .where(
        and(
          eq(invitaciones.perfilId, perfilId),
          eq(invitaciones.estado, "enviada"),
          or(eq(necesidades.estado, "publicada"), eq(necesidades.estado, "en_cotizacion")),
        ),
      ),
  ]);

  return {
    misNecesidades,
    misPropuestas,
    misOperaciones,
    oportunidadesAbiertas: Number(oportunidadesAbiertas[0]?.total ?? 0),
  };
}

/** Traza de una necesidad: la historia completa, en orden. */
export async function trazaDeNecesidad(necesidadId: number) {
  return db
    .select({
      evento: eventos,
      actorNombre: perfiles.nombre,
    })
    .from(eventos)
    .leftJoin(perfiles, eq(perfiles.id, eventos.actorPerfilId))
    .where(and(eq(eventos.entidad, "necesidad"), eq(eventos.entidadId, necesidadId)))
    .orderBy(eventos.creadoEn);
}

/** Cifras del territorio para el panel de inicio. */
export async function pulsoTerritorial(comunaId: number | null) {
  const filtroComuna = comunaId ? sql`and comuna_id = ${comunaId}` : sql``;

  const [actores, necesidadesAbiertas, operacionesCerradas, categoriasCalientes] =
    await Promise.all([
      db.execute<{ total: number }>(
        sql`select count(*)::int as total from perfiles where 1=1 ${filtroComuna}`,
      ),
      db.execute<{ total: number }>(
        sql`select count(*)::int as total from necesidades
            where estado in ('publicada','en_cotizacion') ${filtroComuna}`,
      ),
      db.execute<{ total: number }>(
        sql`select count(*)::int as total from operaciones where estado in ('entregada','cerrada')`,
      ),
      db.execute<{ nombre: string; total: number }>(
        sql`select c.nombre, count(*)::int as total
            from necesidades n join categorias c on c.id = n.categoria_id
            where n.creado_en > now() - interval '30 days' ${filtroComuna}
            group by c.nombre order by total desc limit 4`,
      ),
    ]);

  return {
    actores: Number(actores[0]?.total ?? 0),
    necesidadesAbiertas: Number(necesidadesAbiertas[0]?.total ?? 0),
    operacionesCerradas: Number(operacionesCerradas[0]?.total ?? 0),
    categoriasCalientes: categoriasCalientes.map((c) => ({
      nombre: c.nombre,
      total: Number(c.total),
    })),
  };
}

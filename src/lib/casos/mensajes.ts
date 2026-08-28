import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  conversacionParticipantes,
  conversaciones,
  mensajes,
  perfiles,
} from "@/db/schema";

import { registrarEvento } from "./eventos";

export async function conversacionesDe(perfilId: number) {
  const propias = db
    .select({ conversacionId: conversacionParticipantes.conversacionId })
    .from(conversacionParticipantes)
    .where(eq(conversacionParticipantes.perfilId, perfilId));

  return db
    .select({
      conversacion: conversaciones,
      ultimoMensaje: sql<string | null>`(
        select ${mensajes.cuerpo} from ${mensajes}
        where ${mensajes.conversacionId} = ${conversaciones.id}
        order by ${mensajes.creadoEn} desc limit 1
      )`.as("ultimo_mensaje"),
      ultimaFecha: sql<string | null>`(
        select ${mensajes.creadoEn} from ${mensajes}
        where ${mensajes.conversacionId} = ${conversaciones.id}
        order by ${mensajes.creadoEn} desc limit 1
      )`.as("ultima_fecha"),
      sinLeer: sql<number>`(
        select count(*) from ${mensajes}
        where ${mensajes.conversacionId} = ${conversaciones.id}
          and ${mensajes.autorPerfilId} <> ${perfilId}
          and ${mensajes.leidoEn} is null
      )`.as("sin_leer"),
      otro: sql<string>`(
        select ${perfiles.nombre} from ${conversacionParticipantes}
        join ${perfiles} on ${perfiles.id} = ${conversacionParticipantes.perfilId}
        where ${conversacionParticipantes.conversacionId} = ${conversaciones.id}
          and ${conversacionParticipantes.perfilId} <> ${perfilId}
        limit 1
      )`.as("otro"),
    })
    .from(conversaciones)
    .where(sql`${conversaciones.id} in ${propias}`)
    .orderBy(desc(conversaciones.actualizadoEn))
    .limit(50);
}

export async function obtenerConversacion(conversacionId: number, perfilId: number) {
  const participa = await db
    .select({ x: sql`1` })
    .from(conversacionParticipantes)
    .where(
      and(
        eq(conversacionParticipantes.conversacionId, conversacionId),
        eq(conversacionParticipantes.perfilId, perfilId),
      ),
    )
    .limit(1);

  if (!participa.length) return null;

  const [conversacion] = await db
    .select()
    .from(conversaciones)
    .where(eq(conversaciones.id, conversacionId))
    .limit(1);

  const hilo = await db
    .select({
      mensaje: mensajes,
      autorNombre: perfiles.nombre,
      autorSlug: perfiles.slug,
    })
    .from(mensajes)
    .innerJoin(perfiles, eq(perfiles.id, mensajes.autorPerfilId))
    .where(eq(mensajes.conversacionId, conversacionId))
    .orderBy(mensajes.creadoEn);

  const participantes = await db
    .select({ perfil: perfiles })
    .from(conversacionParticipantes)
    .innerJoin(perfiles, eq(perfiles.id, conversacionParticipantes.perfilId))
    .where(eq(conversacionParticipantes.conversacionId, conversacionId));

  await db
    .update(mensajes)
    .set({ leidoEn: new Date() })
    .where(
      and(
        eq(mensajes.conversacionId, conversacionId),
        sql`${mensajes.autorPerfilId} <> ${perfilId}`,
        sql`${mensajes.leidoEn} is null`,
      ),
    );

  return { conversacion, mensajes: hilo, participantes: participantes.map((p) => p.perfil) };
}

export async function enviarMensaje(entrada: {
  conversacionId: number;
  autorPerfilId: number;
  cuerpo: string;
}) {
  const cuerpo = entrada.cuerpo.trim();
  if (!cuerpo) throw new Error("El mensaje está vacío.");

  const participa = await db
    .select({ x: sql`1` })
    .from(conversacionParticipantes)
    .where(
      and(
        eq(conversacionParticipantes.conversacionId, entrada.conversacionId),
        eq(conversacionParticipantes.perfilId, entrada.autorPerfilId),
      ),
    )
    .limit(1);
  if (!participa.length) throw new Error("No participas en esta conversación.");

  await db.transaction(async (tx) => {
    await tx.insert(mensajes).values({
      conversacionId: entrada.conversacionId,
      autorPerfilId: entrada.autorPerfilId,
      cuerpo,
    });
    await tx
      .update(conversaciones)
      .set({ actualizadoEn: new Date() })
      .where(eq(conversaciones.id, entrada.conversacionId));
  });
}

/** Contacto directo desde una ficha, una publicación o el mapa. */
export async function iniciarConversacion(entrada: {
  dePerfilId: number;
  aPerfilId: number;
  cuerpo: string;
  asunto?: string | null;
  publicacionId?: number | null;
  necesidadId?: number | null;
}) {
  if (entrada.dePerfilId === entrada.aPerfilId) {
    throw new Error("No puedes escribirte a ti mismo.");
  }

  // Si ya existe una conversación entre ambos sobre lo mismo, se reutiliza.
  const existente = await db
    .select({ id: conversaciones.id })
    .from(conversaciones)
    .where(
      sql`${conversaciones.id} in (
        select cp1.conversacion_id from conversacion_participantes cp1
        join conversacion_participantes cp2 on cp1.conversacion_id = cp2.conversacion_id
        where cp1.perfil_id = ${entrada.dePerfilId} and cp2.perfil_id = ${entrada.aPerfilId}
      ) and coalesce(${conversaciones.publicacionId}, -1) = ${entrada.publicacionId ?? -1}
        and coalesce(${conversaciones.necesidadId}, -1) = ${entrada.necesidadId ?? -1}`,
    )
    .limit(1);

  const conversacionId =
    existente[0]?.id ??
    (await db.transaction(async (tx) => {
      const [conversacion] = await tx
        .insert(conversaciones)
        .values({
          asunto: entrada.asunto ?? null,
          publicacionId: entrada.publicacionId ?? null,
          necesidadId: entrada.necesidadId ?? null,
        })
        .returning();

      await tx.insert(conversacionParticipantes).values([
        { conversacionId: conversacion.id, perfilId: entrada.dePerfilId },
        { conversacionId: conversacion.id, perfilId: entrada.aPerfilId },
      ]);

      return conversacion.id;
    }));

  await enviarMensaje({
    conversacionId,
    autorPerfilId: entrada.dePerfilId,
    cuerpo: entrada.cuerpo,
  });

  await registrarEvento({
    tipo: "conversacion.iniciada",
    entidad: "conversacion",
    entidadId: conversacionId,
    actorPerfilId: entrada.dePerfilId,
    datos: { destinatario: entrada.aPerfilId },
  });

  return conversacionId;
}

export async function mensajesSinLeer(perfilId: number) {
  const [fila] = await db
    .select({ total: sql<number>`count(*)` })
    .from(mensajes)
    .innerJoin(
      conversacionParticipantes,
      eq(conversacionParticipantes.conversacionId, mensajes.conversacionId),
    )
    .where(
      and(
        eq(conversacionParticipantes.perfilId, perfilId),
        sql`${mensajes.autorPerfilId} <> ${perfilId}`,
        sql`${mensajes.leidoEn} is null`,
      ),
    );
  return Number(fila?.total ?? 0);
}

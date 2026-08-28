import { and, avg, count, desc, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import {
  calificaciones,
  conversacionParticipantes,
  conversaciones,
  invitaciones,
  mensajes,
  necesidades,
  operaciones,
  perfiles,
  propuestas,
} from "@/db/schema";

import { registrarEvento } from "./eventos";

/**
 * R4 · Cotizar.
 * Quien recibe una oportunidad responde con monto, plazo y mensaje. La
 * necesidad pasa a «en cotización» en el mismo movimiento.
 */
export async function enviarPropuesta(entrada: {
  necesidadId: number;
  perfilId: number;
  monto: number;
  plazoDias: number;
  mensaje?: string | null;
  moneda?: string;
}) {
  const necesidad = await db.query.necesidades.findFirst({
    where: eq(necesidades.id, entrada.necesidadId),
  });
  if (!necesidad) throw new Error("La necesidad no existe.");
  if (necesidad.solicitantePerfilId === entrada.perfilId) {
    throw new Error("No puedes cotizar tu propia necesidad.");
  }
  if (necesidad.estado !== "publicada" && necesidad.estado !== "en_cotizacion") {
    throw new Error("Esta necesidad ya fue cerrada o adjudicada.");
  }
  if (entrada.monto <= 0) throw new Error("El monto debe ser mayor que cero.");
  if (entrada.plazoDias <= 0) throw new Error("El plazo debe ser de al menos un día.");

  const propuesta = await db.transaction(async (tx) => {
    const [fila] = await tx
      .insert(propuestas)
      .values({
        necesidadId: entrada.necesidadId,
        perfilId: entrada.perfilId,
        monto: entrada.monto.toString(),
        moneda: entrada.moneda ?? necesidad.moneda,
        plazoDias: entrada.plazoDias,
        mensaje: entrada.mensaje ?? null,
        estado: "enviada",
      })
      .onConflictDoUpdate({
        target: [propuestas.necesidadId, propuestas.perfilId],
        set: {
          monto: entrada.monto.toString(),
          plazoDias: entrada.plazoDias,
          mensaje: entrada.mensaje ?? null,
          estado: "enviada",
        },
      })
      .returning();

    if (necesidad.estado === "publicada") {
      await tx
        .update(necesidades)
        .set({ estado: "en_cotizacion" })
        .where(eq(necesidades.id, entrada.necesidadId));
    }

    await tx
      .update(invitaciones)
      .set({ estado: "respondida" })
      .where(
        and(
          eq(invitaciones.necesidadId, entrada.necesidadId),
          eq(invitaciones.perfilId, entrada.perfilId),
        ),
      );

    return fila;
  });

  await registrarEvento({
    tipo: "propuesta.enviada",
    entidad: "necesidad",
    entidadId: entrada.necesidadId,
    actorPerfilId: entrada.perfilId,
    datos: { propuestaId: propuesta.id, monto: entrada.monto, plazoDias: entrada.plazoDias },
  });

  return propuesta;
}

export async function retirarPropuesta(entrada: { propuestaId: number; perfilId: number }) {
  const propuesta = await db.query.propuestas.findFirst({
    where: eq(propuestas.id, entrada.propuestaId),
  });
  if (!propuesta) throw new Error("La propuesta no existe.");
  if (propuesta.perfilId !== entrada.perfilId) throw new Error("No es tu propuesta.");
  if (propuesta.estado === "adjudicada") throw new Error("Una propuesta adjudicada no se retira.");

  await db
    .update(propuestas)
    .set({ estado: "retirada" })
    .where(eq(propuestas.id, entrada.propuestaId));

  await registrarEvento({
    tipo: "propuesta.retirada",
    entidad: "necesidad",
    entidadId: propuesta.necesidadId,
    actorPerfilId: entrada.perfilId,
    datos: { propuestaId: propuesta.id },
  });
}

/** Cuadro comparativo: precio, plazo, distancia, reputación y experiencia. */
export async function propuestasDe(necesidadId: number) {
  return db
    .select({
      propuesta: propuestas,
      perfil: perfiles,
      operacionesPrevias: count(operaciones.id),
    })
    .from(propuestas)
    .innerJoin(perfiles, eq(perfiles.id, propuestas.perfilId))
    .leftJoin(operaciones, eq(operaciones.proveedorPerfilId, perfiles.id))
    .where(and(eq(propuestas.necesidadId, necesidadId), ne(propuestas.estado, "retirada")))
    .groupBy(propuestas.id, perfiles.id)
    .orderBy(desc(propuestas.creadoEn));
}

/**
 * R5 · Adjudicar.
 * Cierra la comparación y abre la operación: una propuesta gana, el resto
 * queda descartada, nace la conversación y queda la traza.
 */
export async function adjudicar(entrada: {
  necesidadId: number;
  propuestaId: number;
  actorPerfilId: number;
}) {
  const necesidad = await db.query.necesidades.findFirst({
    where: eq(necesidades.id, entrada.necesidadId),
  });
  if (!necesidad) throw new Error("La necesidad no existe.");
  if (necesidad.solicitantePerfilId !== entrada.actorPerfilId) {
    throw new Error("Solo quien publicó la necesidad puede adjudicarla.");
  }
  if (necesidad.estado === "adjudicada" || necesidad.estado === "completada") {
    throw new Error("Esta necesidad ya fue adjudicada.");
  }

  const propuesta = await db.query.propuestas.findFirst({
    where: eq(propuestas.id, entrada.propuestaId),
  });
  if (!propuesta || propuesta.necesidadId !== entrada.necesidadId) {
    throw new Error("La propuesta no corresponde a esta necesidad.");
  }
  if (propuesta.estado === "retirada") throw new Error("Esa propuesta fue retirada.");

  const operacion = await db.transaction(async (tx) => {
    await tx
      .update(propuestas)
      .set({ estado: "descartada" })
      .where(and(eq(propuestas.necesidadId, entrada.necesidadId), ne(propuestas.id, propuesta.id)));

    await tx
      .update(propuestas)
      .set({ estado: "adjudicada" })
      .where(eq(propuestas.id, propuesta.id));

    await tx
      .update(necesidades)
      .set({ estado: "adjudicada", propuestaAdjudicadaId: propuesta.id })
      .where(eq(necesidades.id, entrada.necesidadId));

    const [nueva] = await tx
      .insert(operaciones)
      .values({
        necesidadId: entrada.necesidadId,
        propuestaId: propuesta.id,
        compradorPerfilId: necesidad.solicitantePerfilId,
        proveedorPerfilId: propuesta.perfilId,
        monto: propuesta.monto,
        moneda: propuesta.moneda,
        estado: "acordada",
      })
      .returning();

    const [conversacion] = await tx
      .insert(conversaciones)
      .values({ asunto: necesidad.titulo, necesidadId: necesidad.id })
      .returning();

    await tx.insert(conversacionParticipantes).values([
      { conversacionId: conversacion.id, perfilId: necesidad.solicitantePerfilId },
      { conversacionId: conversacion.id, perfilId: propuesta.perfilId },
    ]);

    await tx.insert(mensajes).values({
      conversacionId: conversacion.id,
      autorPerfilId: necesidad.solicitantePerfilId,
      cuerpo: `Adjudiqué esta necesidad a tu propuesta. Coordinemos la ejecución de «${necesidad.titulo}».`,
    });

    return nueva;
  });

  await registrarEvento({
    tipo: "necesidad.adjudicada",
    entidad: "necesidad",
    entidadId: entrada.necesidadId,
    actorPerfilId: entrada.actorPerfilId,
    datos: { propuestaId: propuesta.id, operacionId: operacion.id, monto: propuesta.monto },
  });

  return operacion;
}

/** Confirmación de ejecución/entrega. Sin dinero por la plataforma en el MVP. */
export async function registrarEntrega(entrada: { operacionId: number; actorPerfilId: number }) {
  const operacion = await db.query.operaciones.findFirst({
    where: eq(operaciones.id, entrada.operacionId),
  });
  if (!operacion) throw new Error("La operación no existe.");
  if (
    operacion.compradorPerfilId !== entrada.actorPerfilId &&
    operacion.proveedorPerfilId !== entrada.actorPerfilId
  ) {
    throw new Error("No participas en esta operación.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(operaciones)
      .set({ estado: "entregada", completadaEn: new Date() })
      .where(eq(operaciones.id, entrada.operacionId));

    await tx
      .update(necesidades)
      .set({ estado: "en_ejecucion" })
      .where(eq(necesidades.id, operacion.necesidadId));
  });

  await registrarEvento({
    tipo: "operacion.entregada",
    entidad: "operacion",
    entidadId: entrada.operacionId,
    actorPerfilId: entrada.actorPerfilId,
  });
}

/**
 * R6 · Calificación mutua.
 * El octavo estado del ciclo: es lo que hace que la red mejore con el uso.
 * La reputación se recalcula desde las calificaciones; no se edita a mano.
 */
export async function calificar(entrada: {
  operacionId: number;
  autorPerfilId: number;
  puntaje: number;
  comentario?: string | null;
}) {
  if (entrada.puntaje < 1 || entrada.puntaje > 5) {
    throw new Error("La calificación va de 1 a 5.");
  }

  const operacion = await db.query.operaciones.findFirst({
    where: eq(operaciones.id, entrada.operacionId),
  });
  if (!operacion) throw new Error("La operación no existe.");

  const esComprador = operacion.compradorPerfilId === entrada.autorPerfilId;
  const esProveedor = operacion.proveedorPerfilId === entrada.autorPerfilId;
  if (!esComprador && !esProveedor) throw new Error("No participas en esta operación.");
  if (operacion.estado === "acordada") {
    throw new Error("Primero hay que confirmar la entrega.");
  }

  const destinoPerfilId = esComprador ? operacion.proveedorPerfilId : operacion.compradorPerfilId;

  await db
    .insert(calificaciones)
    .values({
      operacionId: entrada.operacionId,
      autorPerfilId: entrada.autorPerfilId,
      destinoPerfilId,
      puntaje: entrada.puntaje,
      comentario: entrada.comentario ?? null,
    })
    .onConflictDoUpdate({
      target: [calificaciones.operacionId, calificaciones.autorPerfilId],
      set: { puntaje: entrada.puntaje, comentario: entrada.comentario ?? null },
    });

  await recalcularReputacion(destinoPerfilId);

  const emitidas = await db
    .select({ total: count() })
    .from(calificaciones)
    .where(eq(calificaciones.operacionId, entrada.operacionId));

  if ((emitidas[0]?.total ?? 0) >= 2) {
    await db.transaction(async (tx) => {
      await tx
        .update(operaciones)
        .set({ estado: "cerrada" })
        .where(eq(operaciones.id, entrada.operacionId));
      await tx
        .update(necesidades)
        .set({ estado: "completada", cerradaEn: new Date() })
        .where(eq(necesidades.id, operacion.necesidadId));
    });
  }

  await registrarEvento({
    tipo: "operacion.calificada",
    entidad: "operacion",
    entidadId: entrada.operacionId,
    actorPerfilId: entrada.autorPerfilId,
    datos: { destinoPerfilId, puntaje: entrada.puntaje },
  });
}

export async function recalcularReputacion(perfilId: number) {
  const [fila] = await db
    .select({ promedio: avg(calificaciones.puntaje), total: count() })
    .from(calificaciones)
    .where(eq(calificaciones.destinoPerfilId, perfilId));

  await db
    .update(perfiles)
    .set({
      reputacionPromedio: fila?.promedio ? Number(fila.promedio).toFixed(2) : null,
      reputacionConteo: fila?.total ?? 0,
      actualizadoEn: new Date(),
    })
    .where(eq(perfiles.id, perfilId));
}

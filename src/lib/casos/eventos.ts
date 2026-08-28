import { db } from "@/db";
import { eventos } from "@/db/schema";

type Entrada = {
  tipo: string;
  entidad: string;
  entidadId?: number | null;
  actorPerfilId?: number | null;
  datos?: Record<string, unknown>;
};

/**
 * Traza de la operación. El prompt pide poder reconstruir qué pasó: solicitud,
 * invitación, propuesta, adjudicación, entrega, calificación. Todo pasa por aquí.
 */
export async function registrarEvento(entrada: Entrada, tx: typeof db = db) {
  await tx.insert(eventos).values({
    tipo: entrada.tipo,
    entidad: entrada.entidad,
    entidadId: entrada.entidadId ?? null,
    actorPerfilId: entrada.actorPerfilId ?? null,
    datos: entrada.datos ?? {},
  });
}

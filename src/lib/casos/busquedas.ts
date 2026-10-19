import { db } from "@/db";
import { busquedas } from "@/db/schema";
import type { Intencion } from "@/lib/ia";

/**
 * Deja registro de lo que la gente pide y de cuántos resultados obtuvo. Es la
 * base para detectar categorías ausentes (S21) y ampliar el catálogo con
 * demanda real (S25).
 */
export async function registrarBusqueda(entrada: {
  perfilId: number | null;
  intencion: Intencion;
  resultados: number;
}) {
  const { intencion } = entrada;
  await db.insert(busquedas).values({
    perfilId: entrada.perfilId,
    consulta: intencion.consulta,
    motor: intencion.motor,
    resultados: entrada.resultados,
    interpretacion: {
      categoriaId: intencion.categoriaId,
      comunaId: intencion.comunaId,
      disponibilidad: intencion.disponibilidad,
      terminos: intencion.terminos,
      explicacion: intencion.explicacion,
    },
  });
}

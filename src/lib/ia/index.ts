import { cache } from "react";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { categorias, comunas } from "@/db/schema";

import { hayModelo, interpretarConModelo } from "./modelo";
import { interpretarConReglas } from "./reglas";
import type { ContextoInterprete, Intencion } from "./tipos";

export type { Intencion, ContextoInterprete } from "./tipos";
export { hayModelo };

/** Taxonomía y territorio activo: el contexto que necesita el intérprete. */
export const contextoInterprete = cache(async (comunaUsuarioId?: number | null) => {
  const [cats, coms] = await Promise.all([
    db
      .select({
        id: categorias.id,
        slug: categorias.slug,
        nombre: categorias.nombre,
        tipo: categorias.tipo,
        sinonimos: categorias.sinonimos,
      })
      .from(categorias)
      .orderBy(asc(categorias.orden)),
    db
      .select({ id: comunas.id, nombre: comunas.nombre })
      .from(comunas)
      .where(eq(comunas.activa, true))
      .orderBy(asc(comunas.nombre)),
  ]);

  return {
    categorias: cats.map((c) => ({ ...c, sinonimos: c.sinonimos ?? [] })),
    comunas: coms,
    comunaUsuarioId: comunaUsuarioId ?? null,
  } satisfies ContextoInterprete;
});

/**
 * Punto único de interpretación. Todo lo que reciba lenguaje natural —el
 * buscador, la publicación de una necesidad, el asistente— entra por aquí.
 */
export async function interpretar(
  consulta: string,
  contexto: ContextoInterprete,
): Promise<Intencion> {
  if (!consulta.trim()) return interpretarConReglas("", contexto);
  return hayModelo()
    ? interpretarConModelo(consulta, contexto)
    : interpretarConReglas(consulta, contexto);
}

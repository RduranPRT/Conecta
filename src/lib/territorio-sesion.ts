import { cache } from "react";
import { cookies } from "next/headers";

import { territorioExplorado, type ComunaElegida } from "@/lib/casos/territorio";

import { obtenerPerfil } from "./sesion";

/** Comuna que la persona eligió explorar. No es un dato personal. */
export const COOKIE_TERRITORIO = "territorio";

const comunaGuardada = cache(async (): Promise<ComunaElegida> => {
  const valor = (await cookies()).get(COOKIE_TERRITORIO)?.value;
  if (!valor) return undefined;
  return valor === "todo" ? null : Number(valor) || undefined;
});

/** Territorio de esta petición: junta URL, elección guardada y perfil. */
export async function territorioDeLaPeticion(comunaUrl?: string | null) {
  const [guardada, perfil] = await Promise.all([comunaGuardada(), obtenerPerfil()]);
  return territorioExplorado({
    url: Number(comunaUrl) || undefined,
    guardada,
    perfil: perfil?.comunaId ?? undefined,
  });
}

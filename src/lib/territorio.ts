import { normalizar } from "@/lib/utils";

/** Reglas puras del territorio: nombres cortos y búsqueda por texto. */

export function abreviarRegion(nombre: string | null | undefined) {
  if (!nombre) return "";
  if (nombre.includes("Metropolitana")) return "RM";
  if (nombre.includes("O'Higgins")) return "O'Higgins";
  if (nombre.includes("Aysén")) return "Aysén";
  if (nombre.includes("Magallanes")) return "Magallanes";
  return nombre.replace(/^Región (de la |de los |de |del )?/, "");
}

/** «Ñuñoa, RM» */
export function nombreTerritorio(comuna: string, region: string | null | undefined) {
  const corta = abreviarRegion(region);
  return corta ? `${comuna}, ${corta}` : comuna;
}

/** Localidades conocidas por otro nombre que el de su comuna. */
const TAMBIEN_LLAMADA: Record<string, string[]> = {
  "Cabo de Hornos": ["Puerto Williams"],
  "Isla de Pascua": ["Rapa Nui", "Hanga Roa"],
  Natales: ["Puerto Natales"],
  Aysén: ["Puerto Aysén"],
  Coyhaique: ["Coihaique"],
  Porvenir: ["Tierra del Fuego"],
  "San Pedro de Atacama": ["San Pedro"],
};

export type ComunaBuscable = { nombre: string; regionNombre: string };

/**
 * Comunas que calzan con lo escrito, sin distinguir tildes ni mayúsculas.
 * Primero las que empiezan igual, luego las que lo contienen y al final las de
 * una región con ese nombre.
 */
export function filtrarComunas<T extends ComunaBuscable>(comunas: T[], texto: string, limite = 30) {
  const q = normalizar(texto);
  if (!q) return comunas.slice(0, limite);
  const puntuadas = comunas.flatMap((c) => {
    const nombres = [c.nombre, ...(TAMBIEN_LLAMADA[c.nombre] ?? [])].map(normalizar);
    if (nombres.some((n) => n === q)) return [{ c, p: 0 }];
    if (nombres.some((n) => n.startsWith(q))) return [{ c, p: 1 }];
    if (nombres.some((n) => n.includes(q))) return [{ c, p: 2 }];
    if (normalizar(c.regionNombre).replace(/'/g, "").includes(q.replace(/'/g, ""))) {
      return [{ c, p: 3 }];
    }
    return [];
  });
  return puntuadas
    .sort((a, b) => a.p - b.p || a.c.nombre.localeCompare(b.c.nombre, "es"))
    .slice(0, limite)
    .map((x) => x.c);
}

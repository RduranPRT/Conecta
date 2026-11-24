import type { RolActor } from "@/db/schema";

/**
 * Cómo se llama cada rol en pantalla. El rol dice cómo participa alguien; no
 * dice qué ofrece (eso son sus actividades) ni quién es (persona o empresa).
 */
export const ETIQUETA_ROL: Record<string, string> = {
  persona: "Comprador",
  prestador: "Prestador de servicios",
  negocio: "Comercio",
  proveedor: "Proveedor a negocios",
  productor: "Productor",
};

/** Roles que ofrecen algo: son los que aparecen en Buscar y en el mapa. */
export const ROLES_QUE_OFRECEN: RolActor[] = ["prestador", "negocio", "proveedor", "productor"];

export function ofreceAlgo(roles: string[]) {
  return roles.some((r) => (ROLES_QUE_OFRECEN as string[]).includes(r));
}

export function etiquetaRoles(roles: string[]) {
  return roles.map((r) => ETIQUETA_ROL[r] ?? r).join(" · ");
}

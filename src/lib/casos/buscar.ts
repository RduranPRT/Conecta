import type { RolActor } from "@/db/schema";
import type { Intencion } from "@/lib/ia";
import { ROLES_QUE_OFRECEN } from "@/lib/roles";

import { buscarActores, type ActorResumen } from "./actores";
import type { TerritorioExplorado } from "./territorio";

export type ResultadoBusqueda = {
  actores: ActorResumen[];
  /** No hubo nada en la comuna pedida y se muestran los de otras comunas (S20). */
  fueraDeTerritorio: boolean;
  /** Roles con los que se buscó. */
  roles: RolActor[];
};

/**
 * Búsqueda del buscador y de las áreas: junta lo que se entendió de la frase
 * con el territorio que se explora.
 *
 * - Una comuna pedida (en la frase, en la URL o elegida antes) filtra.
 * - La comuna del perfil o la piloto solo ordenan por cercanía.
 * - Si el filtro deja vacío el resultado, se busca en todo Chile y se avisa:
 *   «no hay aquí» no es lo mismo que «no existe».
 * - Quien solo compra no aparece: no ofrece nada y su ubicación es su casa.
 */
export async function buscarEnTerritorio(entrada: {
  intencion: Intencion;
  explorado: TerritorioExplorado;
  rol?: string | null;
  desdePerfil?: { lat: number; lng: number } | null;
  conSesion: boolean;
  limite?: number;
}): Promise<ResultadoBusqueda> {
  const { explorado } = entrada;
  const deLaFrase = entrada.intencion.roles.filter((r) => ROLES_QUE_OFRECEN.includes(r));
  const roles = (ROLES_QUE_OFRECEN as string[]).includes(entrada.rol ?? "")
    ? [entrada.rol as RolActor]
    : deLaFrase.length
      ? deLaFrase
      : ROLES_QUE_OFRECEN;

  const comunaId =
    entrada.intencion.comunaId ?? (explorado.explicito ? (explorado.comuna?.id ?? null) : null);
  const centro = explorado.comuna
    ? { lat: explorado.comuna.lat, lng: explorado.comuna.lng }
    : null;
  const opciones = {
    desde: explorado.explicito ? (centro ?? entrada.desdePerfil) : (entrada.desdePerfil ?? centro),
    limite: entrada.limite ?? 30,
    roles,
    conSesion: entrada.conSesion,
  };

  const actores = await buscarActores({ ...entrada.intencion, comunaId }, opciones);
  if (actores.length || !comunaId) return { actores, fueraDeTerritorio: false, roles };

  const fuera = await buscarActores({ ...entrada.intencion, comunaId: null }, opciones);
  return { actores: fuera, fueraDeTerritorio: fuera.length > 0, roles };
}

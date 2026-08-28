import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { comunas, perfilRoles, perfiles, regiones, type RolActor } from "@/db/schema";
import { auth } from "@/lib/auth";

export type PerfilSesion = typeof perfiles.$inferSelect & {
  roles: RolActor[];
  comunaNombre: string | null;
  regionNombre: string | null;
};

/**
 * Sesión del usuario en curso. `cache` la resuelve una sola vez por petición,
 * aunque la llamen el encabezado, la barra lateral y la página.
 */
export const obtenerSesion = cache(async () => {
  const sesion = await auth.api.getSession({ headers: await headers() });
  return sesion ?? null;
});

export const obtenerPerfil = cache(async (): Promise<PerfilSesion | null> => {
  const sesion = await obtenerSesion();
  if (!sesion?.user?.id) return null;

  const filas = await db
    .select({
      perfil: perfiles,
      comunaNombre: comunas.nombre,
      regionNombre: regiones.nombre,
    })
    .from(perfiles)
    .leftJoin(comunas, eq(comunas.id, perfiles.comunaId))
    .leftJoin(regiones, eq(regiones.id, comunas.regionId))
    .where(eq(perfiles.usuarioId, sesion.user.id))
    .limit(1);

  const fila = filas[0];
  if (!fila) return null;

  const roles = await db
    .select({ rol: perfilRoles.rol })
    .from(perfilRoles)
    .where(eq(perfilRoles.perfilId, fila.perfil.id));

  return {
    ...fila.perfil,
    comunaNombre: fila.comunaNombre,
    regionNombre: fila.regionNombre,
    roles: roles.map((r) => r.rol),
  };
});

/** Para pantallas que no existen sin identidad. */
export async function requerirPerfil(destino = "/inicio"): Promise<PerfilSesion> {
  const perfil = await obtenerPerfil();
  if (!perfil) redirect(`/ingresar?destino=${encodeURIComponent(destino)}`);
  return perfil;
}

export function tieneRol(perfil: PerfilSesion | null, ...roles: RolActor[]) {
  if (!perfil) return false;
  return roles.some((rol) => perfil.roles.includes(rol));
}

/** Un actor puede ofrecer si tiene cualquiera de los roles de oferta. */
export function puedeOfrecer(perfil: PerfilSesion | null) {
  return tieneRol(perfil, "prestador", "negocio", "proveedor", "productor");
}

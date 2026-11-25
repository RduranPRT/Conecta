import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { destinoSeguro, rutaIngreso } from "@/lib/destino";
import { obtenerPerfil, obtenerSesion } from "@/lib/sesion";

import { FormularioPerfil } from "./formulario";

export const metadata: Metadata = { title: "Termina tu cuenta" };
export const dynamic = "force-dynamic";

/** Solo para cuentas a medio crear: hay sesión, pero todavía no hay perfil. */
export default async function PaginaOnboarding({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const retorno = destinoSeguro((await searchParams).next);
  const sesion = await obtenerSesion();
  if (!sesion) redirect(rutaIngreso(retorno));

  const perfil = await obtenerPerfil();
  if (perfil) redirect(retorno);

  return (
    <div className="tarjeta p-5 sm:p-8">
      <h1 className="text-lg font-semibold text-texto">Termina tu cuenta</h1>
      <p className="mb-4 text-sm text-tenue">Solo faltan estos datos. El resto es opcional.</p>
      <FormularioPerfil next={retorno} nombreSugerido={sesion.user.name ?? ""} />
    </div>
  );
}

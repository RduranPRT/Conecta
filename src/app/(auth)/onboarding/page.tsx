import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { arbolDeRubros } from "@/lib/casos/categorias";
import { opcionesTerritorio } from "@/lib/casos/territorio";
import { obtenerPerfil, obtenerSesion } from "@/lib/sesion";

import { FormularioPerfil } from "./formulario";

export const metadata: Metadata = { title: "Arma tu perfil" };
export const dynamic = "force-dynamic";

export default async function PaginaOnboarding() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/ingresar");

  const perfil = await obtenerPerfil();
  if (perfil) redirect("/inicio");

  const [territorio, rubros] = await Promise.all([opcionesTerritorio(), arbolDeRubros()]);

  return (
    <div className="tarjeta p-6 sm:p-8">
      <p className="text-xs font-medium uppercase tracking-wide text-marca">Tu cuenta ya existe</p>
      <h1 className="mt-1 text-xl font-semibold text-texto">Ahora arma tu perfil</h1>
      <p className="mt-1 text-sm text-tenue">
        Son dos o tres pasos cortos. Puedes cambiar todo después desde Mi perfil.
      </p>

      <div className="mt-6">
        <FormularioPerfil
          territorio={territorio}
          rubros={rubros}
          nombreSugerido={sesion.user.name ?? ""}
        />
      </div>
    </div>
  );
}

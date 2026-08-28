import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { categoriasDisponibles, comunasActivas } from "@/lib/casos/perfil";
import { obtenerPerfil, obtenerSesion } from "@/lib/sesion";

import { FormularioPerfil } from "./formulario";

export const metadata: Metadata = { title: "Completa tu ficha" };
export const dynamic = "force-dynamic";

export default async function PaginaOnboarding() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/ingresar");

  const perfil = await obtenerPerfil();
  if (perfil) redirect("/inicio");

  const [comunas, categorias] = await Promise.all([comunasActivas(), categoriasDisponibles()]);

  return (
    <div className="tarjeta p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-texto">Completa tu ficha</h1>
      <p className="mt-1 text-sm text-tenue">
        Esto es lo que verán los demás en el buscador, en el mapa y en el feed. Puedes
        cambiarlo cuando quieras.
      </p>

      <div className="mt-6">
        <FormularioPerfil
          comunas={comunas}
          categorias={categorias}
          nombreSugerido={sesion.user.name ?? ""}
        />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { destinoSeguro, INICIO, rutaIngreso } from "@/lib/destino";
import { obtenerPerfil } from "@/lib/sesion";

import { FormularioRegistro } from "./formulario";

export const metadata: Metadata = { title: "Crear cuenta" };
export const dynamic = "force-dynamic";

export default async function PaginaRegistro({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const retorno = destinoSeguro((await searchParams).next);
  const perfil = await obtenerPerfil();
  if (perfil) redirect(retorno);
  const conAccion = retorno !== INICIO;

  return (
    <div className="tarjeta px-5 pt-4 sm:p-8">
      <p className="text-xs font-medium text-marca">
        {conAccion ? "Un solo paso" : "Paso 1 de 2"}
      </p>
      <h1 className="text-lg font-semibold text-texto">Crea tu cuenta</h1>
      <p className="mb-3 text-xs text-tenue">
        {conAccion
          ? "Después vuelves a lo que estabas haciendo."
          : "Después, una pregunta opcional y listo."}{" "}
        ¿Ya tienes cuenta?{" "}
        <Link href={rutaIngreso(retorno)} className="font-medium text-marca hover:underline">
          Ingresa
        </Link>
      </p>

      <FormularioRegistro next={retorno} />
    </div>
  );
}

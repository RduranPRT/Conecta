import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Aviso } from "@/components/ui";
import { destinoSeguro, INICIO, rutaIngreso } from "@/lib/destino";
import { obtenerPerfil } from "@/lib/sesion";

import { FormularioIngreso } from "./formulario";

export const metadata: Metadata = { title: "Ingresar" };
export const dynamic = "force-dynamic";

export default async function PaginaIngreso({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; destino?: string }>;
}) {
  const { next, destino } = await searchParams;
  // `destino` es el nombre anterior del parámetro: se acepta por los enlaces viejos.
  const retorno = destinoSeguro(next ?? destino);
  const perfil = await obtenerPerfil();
  if (perfil) redirect(retorno);

  return (
    <div className="tarjeta p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-texto">Ingresa a Conecta</h1>
      <p className="mt-1 text-sm text-tenue">
        Tu cuenta reúne todos tus roles y toda tu actividad.
      </p>

      {retorno !== INICIO ? (
        <div className="mt-4">
          <Aviso tono="marca">
            Inicia sesión o crea tu cuenta para continuar. Después vuelves a donde estabas.
          </Aviso>
        </div>
      ) : null}

      <div className="mt-6">
        <FormularioIngreso next={retorno} />
      </div>

      <p className="mt-6 text-center text-sm text-tenue">
        ¿Aún no tienes cuenta?{" "}
        <Link href={rutaIngreso(retorno, "/registro")} className="font-medium text-marca hover:underline">
          Crear una
        </Link>
      </p>
    </div>
  );
}

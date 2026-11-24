import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { destinoSeguro, rutaIngreso } from "@/lib/destino";
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

  return (
    <div className="tarjeta p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-texto">Crea tu cuenta</h1>
      <p className="mt-1 text-sm text-tenue">
        Con una sola cuenta puedes buscar lo que necesitas y, si quieres, ofrecer tus servicios
        o productos. Primero tu correo y una contraseña; después, dos o tres preguntas cortas.
      </p>

      <ol className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-tenue">
        <li className="rounded-lg bg-marca/10 px-2 py-1.5 font-medium text-marca">1 · Cuenta</li>
        <li className="rounded-lg bg-superficie2 px-2 py-1.5">2 · Tu perfil</li>
        <li className="rounded-lg bg-superficie2 px-2 py-1.5">3 · ¡Listo!</li>
      </ol>

      <div className="mt-6">
        <FormularioRegistro next={retorno} />
      </div>

      <p className="mt-6 text-center text-sm text-tenue">
        ¿Ya tienes cuenta?{" "}
        <Link href={rutaIngreso(retorno)} className="font-medium text-marca hover:underline">
          Ingresa
        </Link>
        {" · "}
        <Link href="/explorar" className="font-medium text-marca hover:underline">
          Explorar sin cuenta
        </Link>
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { FormularioIngreso } from "./formulario";

export const metadata: Metadata = { title: "Ingresar" };

export default async function PaginaIngreso({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string }>;
}) {
  const { destino } = await searchParams;

  return (
    <div className="tarjeta p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-texto">Ingresa a Conecta</h1>
      <p className="mt-1 text-sm text-tenue">
        Tu cuenta reúne todos tus roles y toda tu actividad.
      </p>

      <div className="mt-6">
        <FormularioIngreso destino={destino ?? "/inicio"} />
      </div>

      <p className="mt-6 text-center text-sm text-tenue">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-marca hover:underline">
          Crear una
        </Link>
      </p>
    </div>
  );
}

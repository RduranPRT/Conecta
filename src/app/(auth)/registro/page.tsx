import type { Metadata } from "next";
import Link from "next/link";

import { FormularioRegistro } from "./formulario";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function PaginaRegistro() {
  return (
    <div className="tarjeta p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-texto">Crea tu cuenta</h1>
      <p className="mt-1 text-sm text-tenue">
        Una sola identidad. Después eliges los roles que necesites: persona, prestador,
        negocio, proveedor o productor.
      </p>

      <div className="mt-6">
        <FormularioRegistro />
      </div>

      <p className="mt-6 text-center text-sm text-tenue">
        ¿Ya tienes cuenta?{" "}
        <Link href="/ingresar" className="font-medium text-marca hover:underline">
          Ingresa
        </Link>
      </p>
    </div>
  );
}

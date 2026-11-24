import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Tarjeta } from "@/components/ui";
import { requerirPerfil } from "@/lib/sesion";

import { PreguntaInicial } from "./pregunta";

export const metadata: Metadata = { title: "Tu cuenta está lista" };
export const dynamic = "force-dynamic";

/**
 * Confirma el alta (S08) y hace la única pregunta opcional del registro: qué se
 * quiere hacer. Se puede saltar, y buscar y ofrecer no se excluyen (S22).
 */
export default async function PaginaBienvenida() {
  const perfil = await requerirPerfil("/bienvenida");

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Tarjeta className="flex items-center gap-3 px-5 py-4">
        <CheckCircle2 size={32} className="shrink-0 text-exito" aria-hidden />
        <div>
          <h1 className="text-lg font-semibold text-texto">Tu cuenta está lista</h1>
          <p className="text-sm text-tenue">
            Hola, {perfil.nombre.split(" ")[0]}. Ya puedes buscar, guardar y contactar.
          </p>
        </div>
      </Tarjeta>

      <Tarjeta className="p-5">
        <p className="text-xs font-medium text-marca">Paso 2 de 2 · opcional</p>
        <h2 className="text-base font-semibold text-texto">¿Qué quieres hacer?</h2>
        <p className="mb-3 text-sm text-tenue">
          No son excluyentes: es la misma cuenta y lo puedes cambiar cuando quieras.
        </p>
        <PreguntaInicial />
      </Tarjeta>

      <p className="text-center">
        <Link href="/" className="text-sm text-tenue hover:text-texto">
          Saltar por ahora
        </Link>
      </p>
    </div>
  );
}

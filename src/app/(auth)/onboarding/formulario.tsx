"use client";

import { useActionState } from "react";

import { accionCrearPerfil, type EstadoAccion } from "@/app/acciones";
import { SeccionIdentidad } from "@/components/campos-ficha";
import { CampoRut } from "@/components/completar-datos";
import { Aviso, Boton } from "@/components/ui";

export function FormularioPerfil({
  nombreSugerido,
  next,
}: {
  nombreSugerido: string;
  next: string;
}) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(
    accionCrearPerfil,
    {},
  );

  return (
    <form action={enviar} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {estado?.error ? <Aviso tono="peligro">{estado.error}</Aviso> : null}
      <SeccionIdentidad inicial={{ nombre: nombreSugerido }} />
      <CampoRut ayuda="Para que cada cuenta sea de alguien real. No se muestra." />
      <Boton type="submit" className="w-full" disabled={pendiente}>
        {pendiente ? "Guardando…" : "Terminar mi cuenta"}
      </Boton>
    </form>
  );
}

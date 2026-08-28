"use client";

import { useActionState } from "react";

import { accionContactar, type EstadoAccion } from "@/app/acciones";
import { Aviso, Boton } from "@/components/ui";

export function FormularioContacto({
  perfilId,
  nombre,
}: {
  perfilId: number;
  nombre: string;
}) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(accionContactar, {});

  return (
    <form action={enviar} className="space-y-3">
      {estado?.error ? <Aviso tono="peligro">{estado.error}</Aviso> : null}
      <input type="hidden" name="perfilId" value={perfilId} />

      <textarea
        name="cuerpo"
        required
        className="campo min-h-[5rem]"
        placeholder={`Hola ${nombre.split(" ")[0]}, quería consultarte por…`}
      />

      <Boton type="submit" disabled={pendiente}>
        {pendiente ? "Enviando…" : "Enviar mensaje"}
      </Boton>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useRef } from "react";
import { SendHorizonal } from "lucide-react";

import { accionEnviarMensaje, type EstadoAccion } from "@/app/acciones";
import { Aviso, Boton } from "@/components/ui";

export function FormularioMensaje({ conversacionId }: { conversacionId: number }) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(
    accionEnviarMensaje,
    {},
  );
  const formulario = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado?.ok) formulario.current?.reset();
  }, [estado]);

  return (
    <form ref={formulario} action={enviar} className="space-y-2">
      {estado?.error ? <Aviso tono="peligro">{estado.error}</Aviso> : null}
      <input type="hidden" name="conversacionId" value={conversacionId} />
      <div className="flex items-end gap-2">
        <textarea
          name="cuerpo"
          required
          className="campo min-h-[3rem] flex-1"
          placeholder="Escribe un mensaje…"
        />
        <Boton type="submit" disabled={pendiente} aria-label="Enviar">
          <SendHorizonal size={16} />
        </Boton>
      </div>
    </form>
  );
}

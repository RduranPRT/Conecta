"use client";

import { useActionState } from "react";

import { accionIngreso, type EstadoAccion } from "@/app/acciones";
import { Aviso, Boton } from "@/components/ui";

export function FormularioIngreso({ destino }: { destino: string }) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(accionIngreso, {});

  return (
    <form action={enviar} className="space-y-4">
      {estado?.error ? <Aviso tono="peligro">{estado.error}</Aviso> : null}
      <input type="hidden" name="destino" value={destino} />

      <div>
        <label className="etiqueta" htmlFor="email">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="campo"
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label className="etiqueta" htmlFor="clave">
          Contraseña
        </label>
        <input
          id="clave"
          name="clave"
          type="password"
          className="campo"
          required
          autoComplete="current-password"
        />
      </div>

      <Boton type="submit" className="w-full" disabled={pendiente}>
        {pendiente ? "Ingresando…" : "Ingresar"}
      </Boton>
    </form>
  );
}

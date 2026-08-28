"use client";

import { useActionState } from "react";

import { accionRegistro, type EstadoAccion } from "@/app/acciones";
import { Aviso, Boton } from "@/components/ui";

export function FormularioRegistro() {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(
    accionRegistro,
    {},
  );

  return (
    <form action={enviar} className="space-y-4">
      {estado?.error ? <Aviso tono="peligro">{estado.error}</Aviso> : null}

      <div>
        <label className="etiqueta" htmlFor="nombre">
          Nombre o razón social
        </label>
        <input id="nombre" name="nombre" className="campo" required autoComplete="name" />
      </div>

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
          minLength={8}
          autoComplete="new-password"
        />
        <p className="ayuda">Mínimo 8 caracteres.</p>
      </div>

      <Boton type="submit" className="w-full" disabled={pendiente}>
        {pendiente ? "Creando cuenta…" : "Crear cuenta"}
      </Boton>
    </form>
  );
}

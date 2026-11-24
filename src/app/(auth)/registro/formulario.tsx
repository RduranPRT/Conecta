"use client";

import { useActionState } from "react";

import { accionRegistro, type EstadoAccion } from "@/app/acciones";
import { CampoRut } from "@/components/completar-datos";
import { Aviso, Boton } from "@/components/ui";
import { sinReiniciar } from "@/lib/envio";

/** Alta mínima (D6): cuatro datos, cada uno con para qué se pide (S04). */
export function FormularioRegistro({ next }: { next: string }) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(
    accionRegistro,
    {},
  );

  return (
    <form action={enviar} onSubmit={sinReiniciar(enviar)}>
      <div className="space-y-3">
        <input type="hidden" name="next" value={next} />

        <div>
          <label className="etiqueta" htmlFor="nombre">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            className="campo"
            required
            minLength={2}
            autoComplete="name"
            defaultValue={estado?.valores?.nombre}
            placeholder="Juana Pérez o Repuestos del Sur"
          />
          <p className="ayuda">Así te verán los demás. Puede ser el de tu negocio.</p>
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
            defaultValue={estado?.valores?.email}
          />
          <p className="ayuda">Para entrar a tu cuenta. No se muestra.</p>
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
          <p className="ayuda">Para que solo tú entres. Mínimo 8 caracteres.</p>
        </div>

        <CampoRut ayuda="Para que cada cuenta sea de alguien real. No se muestra." inicial={estado?.valores?.rut} />
      </div>

      <div className="sticky bottom-0 -mx-5 mt-4 space-y-3 rounded-b-2xl border-t border-borde bg-superficie px-5 py-3 sm:-mx-8 sm:-mb-8 sm:px-8">
        {estado?.error ? <Aviso tono="peligro">{estado.error}</Aviso> : null}
        <Boton type="submit" className="w-full" disabled={pendiente}>
          {pendiente ? "Creando tu cuenta…" : "Crear mi cuenta"}
        </Boton>
      </div>
    </form>
  );
}

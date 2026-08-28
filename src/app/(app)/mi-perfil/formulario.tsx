"use client";

import { useActionState, useState } from "react";

import { accionActualizarPerfil, type EstadoAccion } from "@/app/acciones";
import {
  CamposFicha,
  type OpcionCategoria,
  type OpcionComuna,
} from "@/components/campos-ficha";
import { Aviso, Boton } from "@/components/ui";
import { cn } from "@/lib/utils";

export function FormularioEdicion({
  comunas,
  categorias,
  inicial,
  coberturaInicial,
}: {
  comunas: OpcionComuna[];
  categorias: OpcionCategoria[];
  inicial: Parameters<typeof CamposFicha>[0]["inicial"];
  coberturaInicial: number[];
}) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(
    accionActualizarPerfil,
    {},
  );
  const [cobertura, setCobertura] = useState<number[]>(coberturaInicial);

  return (
    <form action={enviar} className="space-y-6">
      {estado?.error ? <Aviso tono="peligro">{estado.error}</Aviso> : null}
      {estado?.ok ? <Aviso tono="exito">{estado.mensaje}</Aviso> : null}

      <CamposFicha comunas={comunas} categorias={categorias} inicial={inicial} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="etiqueta" htmlFor="correoPublico">
            Correo de contacto público
          </label>
          <input
            id="correoPublico"
            name="correoPublico"
            type="email"
            className="campo"
            defaultValue={inicial?.correoPublico ?? ""}
          />
        </div>
        <div>
          <label className="etiqueta" htmlFor="sitioWeb">
            Sitio web o red
          </label>
          <input
            id="sitioWeb"
            name="sitioWeb"
            className="campo"
            defaultValue={inicial?.sitioWeb ?? ""}
            placeholder="https://"
          />
        </div>
      </div>

      <fieldset>
        <legend className="etiqueta">Zona de cobertura</legend>
        <p className="ayuda mb-2 mt-0">
          Comunas donde operas, además de aquella donde estás físicamente.
        </p>
        <div className="flex flex-wrap gap-2">
          {comunas.map((c) => {
            const activo = cobertura.includes(c.id);
            return (
              <label
                key={c.id}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-xs transition",
                  activo
                    ? "border-marca bg-marca text-white"
                    : "border-borde bg-superficie text-tenue hover:bg-superficie2",
                )}
              >
                <input
                  type="checkbox"
                  name="cobertura"
                  value={c.id}
                  checked={activo}
                  onChange={() =>
                    setCobertura((prev) =>
                      prev.includes(c.id) ? prev.filter((v) => v !== c.id) : [...prev, c.id],
                    )
                  }
                  className="sr-only"
                />
                {c.nombre}
              </label>
            );
          })}
        </div>
      </fieldset>

      <Boton type="submit" disabled={pendiente}>
        {pendiente ? "Guardando…" : "Guardar cambios"}
      </Boton>
    </form>
  );
}

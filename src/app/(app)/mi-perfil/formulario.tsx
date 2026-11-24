"use client";

import { useActionState, useState } from "react";

import { accionActualizarPerfil, type EstadoAccion } from "@/app/acciones";
import {
  ROLES_QUE_OFRECEN,
  SeccionActividades,
  SeccionContacto,
  SeccionIdentidad,
  SeccionIntereses,
  SeccionOferta,
  SeccionUbicacion,
  type InicialFicha,
} from "@/components/campos-ficha";
import { SelectorCobertura, type Territorio } from "@/components/selector-comuna";
import type { RubroOpcion } from "@/components/selector-actividades";
import { Aviso, Boton } from "@/components/ui";

function Bloque({
  titulo,
  bajada,
  children,
}: {
  titulo: string;
  bajada?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-borde pt-6 first:border-t-0 first:pt-0">
      <div>
        <h2 className="text-base font-semibold text-texto">{titulo}</h2>
        {bajada ? <p className="text-xs text-tenue">{bajada}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Mi perfil usa las mismas secciones que el registro: un solo vocabulario. */
export function FormularioEdicion({
  territorio,
  rubros,
  prefijo,
  inicial,
  coberturaInicial,
  intereses,
}: {
  intereses: number[];
  territorio: Territorio;
  rubros: RubroOpcion[];
  prefijo: string;
  inicial: InicialFicha;
  coberturaInicial: number[];
}) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(
    accionActualizarPerfil,
    {},
  );
  const [roles, setRoles] = useState<string[]>(inicial.roles ?? ["persona"]);
  const ofrece = roles.some((r) => ROLES_QUE_OFRECEN.includes(r));

  return (
    <form action={enviar}>
      {/* Contenedor propio: React agrega campos ocultos al inicio del formulario. */}
      <div className="space-y-6">
        <Bloque titulo="Quién eres">
          <SeccionIdentidad inicial={inicial} />
        </Bloque>

        <Bloque titulo="Qué haces en Conecta">
          <SeccionActividades roles={roles} setRoles={setRoles} />
        </Bloque>

        {ofrece ? (
          <Bloque
            titulo="Lo que ofreces"
            bajada="Aparece en tu ficha y decide en qué búsquedas te encuentran."
          >
            <SeccionOferta rubros={rubros} roles={roles} inicial={inicial} />
          </Bloque>
        ) : (
          <input type="hidden" name="descripcion" value={inicial.descripcion ?? ""} />
        )}

        <Bloque
          titulo="Lo que te interesa"
          bajada="Es distinto de lo que ofreces: solo ordena lo que te mostramos. Puedes buscar cualquier cosa igual."
        >
          <SeccionIntereses rubros={rubros} inicial={intereses} />
        </Bloque>

        <Bloque titulo="Dónde estás">
          <SeccionUbicacion territorio={territorio} inicial={inicial} />
        </Bloque>

        {ofrece ? (
          <Bloque
            titulo="Otras comunas donde atiendes"
            bajada="Además de la comuna donde estás. Te encuentran también quienes buscan en ellas."
          >
            <SelectorCobertura territorio={territorio} inicial={coberturaInicial} />
          </Bloque>
        ) : null}

        <Bloque
          titulo="Contacto y datos comerciales"
          bajada="Todo es opcional aquí. Te lo pediremos solo cuando una acción lo necesite."
        >
          <SeccionContacto inicial={inicial} prefijo={prefijo} />
        </Bloque>
      </div>

      <div className="sticky bottom-16 z-10 mt-6 -mx-5 space-y-3 border-t border-borde bg-superficie px-5 py-4 sm:-mx-6 sm:px-6 lg:bottom-0">
        {estado?.error ? <Aviso tono="peligro">{estado.error}</Aviso> : null}
        {estado?.ok ? <Aviso tono="exito">{estado.mensaje}</Aviso> : null}
        <Boton type="submit" className="w-full sm:w-auto" disabled={pendiente}>
          {pendiente ? "Guardando…" : "Guardar cambios"}
        </Boton>
      </div>
    </form>
  );
}

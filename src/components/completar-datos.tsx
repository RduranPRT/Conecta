"use client";

import { useActionState } from "react";

import { accionCompletarDatos, type EstadoAccion } from "@/app/acciones";
import { CampoTelefono } from "@/components/campos-ficha";
import { SelectorActividades, type RubroOpcion } from "@/components/selector-actividades";
import { SelectorComuna, type Territorio } from "@/components/selector-comuna";
import { Aviso, Boton } from "@/components/ui";
import { sinReiniciar } from "@/lib/envio";
import type { AccionConRequisitos, Requisito } from "@/lib/casos/requisitos";

/** Campo del RUT, con su explicación. Lo usan el alta y las cuentas antiguas. */
export function CampoRut({ ayuda, inicial }: { ayuda: string; inicial?: string }) {
  return (
    <div>
      <label className="etiqueta" htmlFor="rut">
        RUT (persona o empresa)
      </label>
      <input
        id="rut"
        name="rut"
        className="campo"
        required
        autoComplete="off"
        autoCapitalize="characters"
        defaultValue={inicial}
        placeholder="12.345.678-5"
        aria-describedby="rut-ayuda"
      />
      <p className="ayuda" id="rut-ayuda">
        {ayuda}
      </p>
    </div>
  );
}

/**
 * Pide solo lo que falta para una acción y dice para qué (S05). Al guardar se
 * sigue en `next`, que normalmente es la misma pantalla.
 */
export function FormularioCompletar({
  accion,
  faltan,
  next,
  territorio,
  rubros,
  prefijo,
  boton = "Guardar y continuar",
}: {
  accion: AccionConRequisitos;
  faltan: Requisito[];
  next: string;
  territorio: Territorio;
  rubros: RubroOpcion[];
  prefijo: string;
  boton?: string;
}) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(
    accionCompletarDatos,
    {},
  );
  const motivo = (campo: Requisito["campo"]) => faltan.find((f) => f.campo === campo)?.motivo;

  return (
    <form action={enviar} onSubmit={sinReiniciar(enviar)} className="space-y-5">
      <input type="hidden" name="accion" value={accion} />
      <input type="hidden" name="next" value={next} />

      {motivo("identificadorFiscal") ? <CampoRut ayuda={motivo("identificadorFiscal")!} /> : null}

      {motivo("comunaId") ? (
        <div>
          <SelectorComuna territorio={territorio} requerido idBase="completar" />
          <p className="ayuda">{motivo("comunaId")}</p>
        </div>
      ) : null}

      {motivo("actividad") ? (
        <div>
          <p className="etiqueta">¿Qué ofreces?</p>
          <p className="ayuda mb-3 mt-0">{motivo("actividad")}</p>
          <SelectorActividades rubros={rubros} />
        </div>
      ) : null}

      {motivo("telefono") ? (
        <div>
          <CampoTelefono prefijo={prefijo} requerido id="completar-telefono" />
          <p className="ayuda">{motivo("telefono")}</p>
        </div>
      ) : null}

      <div className="sticky bottom-14 z-10 -mx-5 space-y-3 border-t border-borde bg-superficie px-5 py-3 sm:-mx-6 sm:px-6 lg:bottom-0">
        {estado?.error ? <Aviso tono="peligro">{estado.error}</Aviso> : null}
        <Boton type="submit" className="w-full" disabled={pendiente}>
          {pendiente ? "Guardando…" : boton}
        </Boton>
      </div>
    </form>
  );
}

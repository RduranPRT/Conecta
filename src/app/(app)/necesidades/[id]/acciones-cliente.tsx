"use client";

import { useActionState, useTransition } from "react";

import {
  accionAdjudicar,
  accionCalificar,
  accionEnviarPropuesta,
  accionInvitar,
  accionRegistrarEntrega,
  type EstadoAccion,
} from "@/app/acciones";
import { Aviso, Boton } from "@/components/ui";

export function BotonInvitar({
  necesidadId,
  perfilId,
  yaInvitado,
}: {
  necesidadId: number;
  perfilId: number;
  yaInvitado: boolean;
}) {
  const [pendiente, iniciar] = useTransition();

  if (yaInvitado) {
    return <span className="text-xs text-tenue">Ya invitado</span>;
  }

  return (
    <Boton
      variante="secundario"
      tamano="sm"
      disabled={pendiente}
      onClick={() => iniciar(() => void accionInvitar(necesidadId, perfilId))}
    >
      {pendiente ? "Invitando…" : "Invitar a cotizar"}
    </Boton>
  );
}

export function BotonAdjudicar({
  necesidadId,
  propuestaId,
}: {
  necesidadId: number;
  propuestaId: number;
}) {
  const [pendiente, iniciar] = useTransition();

  return (
    <Boton
      tamano="sm"
      disabled={pendiente}
      onClick={() => iniciar(() => void accionAdjudicar(necesidadId, propuestaId))}
    >
      {pendiente ? "Adjudicando…" : "Adjudicar"}
    </Boton>
  );
}

export function BotonEntrega({ operacionId }: { operacionId: number }) {
  const [pendiente, iniciar] = useTransition();

  return (
    <Boton
      variante="secundario"
      tamano="sm"
      disabled={pendiente}
      onClick={() => iniciar(() => void accionRegistrarEntrega(operacionId))}
    >
      {pendiente ? "Registrando…" : "Confirmar entrega"}
    </Boton>
  );
}

export function FormularioPropuesta({
  necesidadId,
  moneda,
  propuestaPrevia,
}: {
  necesidadId: number;
  moneda: string;
  propuestaPrevia?: { monto: string; plazoDias: number; mensaje: string | null } | null;
}) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(
    accionEnviarPropuesta,
    {},
  );

  return (
    <form action={enviar} className="space-y-4">
      {estado?.error ? <Aviso tono="peligro">{estado.error}</Aviso> : null}
      {estado?.ok ? <Aviso tono="exito">{estado.mensaje}</Aviso> : null}
      <input type="hidden" name="necesidadId" value={necesidadId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="etiqueta" htmlFor="monto">
            Monto ({moneda})
          </label>
          <input
            id="monto"
            name="monto"
            inputMode="numeric"
            className="campo"
            required
            defaultValue={propuestaPrevia?.monto ?? ""}
            placeholder="45000"
          />
        </div>
        <div>
          <label className="etiqueta" htmlFor="plazoDias">
            Plazo (días)
          </label>
          <input
            id="plazoDias"
            name="plazoDias"
            type="number"
            min={1}
            className="campo"
            required
            defaultValue={propuestaPrevia?.plazoDias ?? 2}
          />
        </div>
      </div>

      <div>
        <label className="etiqueta" htmlFor="mensaje">
          Qué incluye tu propuesta
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          className="campo min-h-[5rem]"
          defaultValue={propuestaPrevia?.mensaje ?? ""}
          placeholder="Visita, diagnóstico, repuesto y garantía de 3 meses."
        />
      </div>

      <Boton type="submit" disabled={pendiente}>
        {pendiente
          ? "Enviando…"
          : propuestaPrevia
            ? "Actualizar mi propuesta"
            : "Enviar propuesta"}
      </Boton>
    </form>
  );
}

export function FormularioCalificacion({
  operacionId,
  contraparte,
}: {
  operacionId: number;
  contraparte: string;
}) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(
    accionCalificar,
    {},
  );

  return (
    <form action={enviar} className="space-y-3">
      {estado?.error ? <Aviso tono="peligro">{estado.error}</Aviso> : null}
      {estado?.ok ? <Aviso tono="exito">{estado.mensaje}</Aviso> : null}
      <input type="hidden" name="operacionId" value={operacionId} />

      <div>
        <label className="etiqueta" htmlFor={`puntaje-${operacionId}`}>
          ¿Cómo estuvo el trabajo con {contraparte}?
        </label>
        <select id={`puntaje-${operacionId}`} name="puntaje" className="campo" defaultValue="5">
          <option value="5">5 · Excelente</option>
          <option value="4">4 · Bueno</option>
          <option value="3">3 · Aceptable</option>
          <option value="2">2 · Con problemas</option>
          <option value="1">1 · Malo</option>
        </select>
      </div>

      <textarea
        name="comentario"
        className="campo min-h-[4rem]"
        placeholder="Un comentario breve ayuda a los demás a decidir."
      />

      <Boton type="submit" tamano="sm" disabled={pendiente}>
        {pendiente ? "Guardando…" : "Calificar"}
      </Boton>
    </form>
  );
}

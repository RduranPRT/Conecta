"use client";

import { useActionState, useTransition } from "react";

import {
  accionResolverSolicitudCategoria,
  accionResolverVerificacion,
  type EstadoAccion,
} from "@/app/acciones";
import { SelectCategoria, type RubroOpcion } from "@/components/selector-especialidades";
import { Boton } from "@/components/ui";

export function BotonVerificacion({
  id,
  estado,
}: {
  id: number;
  estado: "verificado" | "rechazado";
}) {
  const [pendiente, iniciar] = useTransition();

  return (
    <Boton
      tamano="sm"
      variante={estado === "verificado" ? "primario" : "peligro"}
      disabled={pendiente}
      onClick={() => iniciar(() => void accionResolverVerificacion(id, estado))}
    >
      {estado === "verificado" ? "Verificar" : "Rechazar"}
    </Boton>
  );
}

/** Asigna una actividad «Otro» a una especialidad existente o la descarta. */
export function FormularioSolicitudCategoria({
  solicitudId,
  rubros,
}: {
  solicitudId: number;
  rubros: RubroOpcion[];
}) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(
    accionResolverSolicitudCategoria,
    {},
  );

  if (estado?.ok) return <p className="text-xs text-exito">{estado.mensaje}</p>;

  return (
    <form action={enviar} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input type="hidden" name="solicitudId" value={solicitudId} />
      <SelectCategoria
        rubros={rubros}
        id={`categoria-${solicitudId}`}
        vacia="Asignar a…"
        className="campo h-9 py-1 text-xs sm:max-w-[16rem]"
      />
      <div className="flex gap-2">
        <Boton type="submit" name="decision" value="asignar" tamano="sm" disabled={pendiente}>
          Asignar
        </Boton>
        <Boton
          type="submit"
          name="decision"
          value="descartar"
          tamano="sm"
          variante="secundario"
          disabled={pendiente}
        >
          Descartar
        </Boton>
      </div>
      {estado?.error ? <p className="text-xs text-peligro">{estado.error}</p> : null}
    </form>
  );
}

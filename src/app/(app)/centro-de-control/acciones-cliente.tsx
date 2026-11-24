"use client";

import { useActionState, useState, useTransition } from "react";

import {
  accionResolverSolicitudCategoria,
  accionResolverVerificacion,
  type EstadoAccion,
} from "@/app/acciones";
import { SelectorCategoria, type OpcionCategoria } from "@/components/selector-categoria";
import { Boton } from "@/components/ui";
import { cn } from "@/lib/utils";

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

const DECISIONES = [
  { valor: "aprobar", etiqueta: "Crear ítem nuevo" },
  { valor: "fusionar", etiqueta: "Ya existe" },
  { valor: "rechazar", etiqueta: "Rechazar" },
] as const;

/** Resuelve una actividad «Otro»: ítem nuevo, uno que ya existe o rechazo. */
export function FormularioSolicitudCategoria({
  solicitudId,
  texto,
  opciones,
}: {
  solicitudId: number;
  texto: string;
  opciones: OpcionCategoria[];
}) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(
    accionResolverSolicitudCategoria,
    {},
  );
  const [decision, setDecision] = useState<(typeof DECISIONES)[number]["valor"]>("aprobar");

  if (estado?.ok) return <p className="text-xs text-exito">{estado.mensaje}</p>;

  return (
    <form action={enviar} className="space-y-2">
      <input type="hidden" name="solicitudId" value={solicitudId} />
      <input type="hidden" name="decision" value={decision} />
      <div className="inline-flex rounded-xl border border-borde p-0.5" role="group" aria-label="Decisión">
        {DECISIONES.map((d) => (
          <button
            key={d.valor}
            type="button"
            aria-pressed={decision === d.valor}
            onClick={() => setDecision(d.valor)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs transition",
              decision === d.valor ? "bg-marca font-medium text-white" : "text-tenue hover:bg-superficie2",
            )}
          >
            {d.etiqueta}
          </button>
        ))}
      </div>

      {decision === "aprobar" ? (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr]">
          <input
            name="nombre"
            defaultValue={texto}
            aria-label="Nombre del ítem"
            className="campo h-10 py-1"
          />
          <select name="clase" aria-label="Tipo" className="campo h-10 py-1" defaultValue="servicio">
            <option value="servicio">Servicio</option>
            <option value="producto">Producto</option>
          </select>
          <SelectorCategoria
            opciones={opciones}
            nombre="subgrupoId"
            id={`subgrupo-${solicitudId}`}
            niveles={["subgrupo"]}
            placeholder="¿En qué subgrupo va?"
            compacto
          />
        </div>
      ) : null}
      {decision === "fusionar" ? (
        <SelectorCategoria
          opciones={opciones}
          id={`categoria-${solicitudId}`}
          niveles={["item", "oficio", "subgrupo"]}
          placeholder="¿Cuál es?"
          compacto
        />
      ) : null}

      <div className="flex items-center gap-3">
        <Boton
          type="submit"
          tamano="sm"
          variante={decision === "rechazar" ? "peligro" : "primario"}
          disabled={pendiente}
        >
          {pendiente ? "Guardando…" : "Resolver"}
        </Boton>
        {estado?.error ? <p className="text-xs text-peligro">{estado.error}</p> : null}
      </div>
    </form>
  );
}

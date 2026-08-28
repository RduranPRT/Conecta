"use client";

import { useState, useTransition } from "react";

import { accionContratarAgente, accionDesactivarAgente } from "@/app/acciones";
import { Boton, Insignia, Tarjeta } from "@/components/ui";
import { cn } from "@/lib/utils";

const NIVELES = [
  { valor: 1, titulo: "Recomienda", texto: "Sugiere y explica; tú haces." },
  { valor: 2, titulo: "Prepara", texto: "Deja todo listo y pide tu aprobación." },
  { valor: 3, titulo: "Ejecuta", texto: "Actúa dentro de lo que autorizaste antes." },
];

export function TarjetaAgente({
  codigo,
  nombre,
  descripcion,
  disponible,
  contratado,
  nivelActual,
}: {
  codigo: string;
  nombre: string;
  descripcion: string;
  disponible: boolean;
  contratado: boolean;
  nivelActual: number | null;
}) {
  const [nivel, setNivel] = useState(nivelActual ?? 1);
  const [pendiente, iniciar] = useTransition();

  return (
    <Tarjeta className={cn("p-5", !disponible && "opacity-75")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-texto">{nombre}</h3>
          <p className="mt-1 text-xs text-tenue">{descripcion}</p>
        </div>
        {contratado ? (
          <Insignia tono="exito">Activo</Insignia>
        ) : disponible ? (
          <Insignia tono="marca">Disponible</Insignia>
        ) : (
          <Insignia tono="contorno">Fase 2</Insignia>
        )}
      </div>

      <fieldset className="mt-4">
        <legend className="text-[11px] font-medium uppercase tracking-wider text-tenue">
          Nivel de autonomía
        </legend>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
          {NIVELES.map((n) => (
            <button
              key={n.valor}
              type="button"
              onClick={() => setNivel(n.valor)}
              className={cn(
                "rounded-lg border px-2.5 py-2 text-left transition",
                nivel === n.valor
                  ? "border-marca bg-marca/10"
                  : "border-borde bg-superficie hover:bg-superficie2",
              )}
            >
              <span className="block text-xs font-medium text-texto">
                {n.valor} · {n.titulo}
              </span>
              <span className="block text-[10px] leading-tight text-tenue">{n.texto}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex items-center gap-2">
        <Boton
          tamano="sm"
          variante={contratado ? "secundario" : "primario"}
          disabled={pendiente}
          onClick={() => iniciar(() => void accionContratarAgente(codigo, nivel))}
        >
          {contratado ? "Guardar nivel" : "Contratar agente"}
        </Boton>
        {contratado ? (
          <Boton
            tamano="sm"
            variante="fantasma"
            disabled={pendiente}
            onClick={() => iniciar(() => void accionDesactivarAgente(codigo))}
          >
            Desactivar
          </Boton>
        ) : null}
      </div>

      {!disponible ? (
        <p className="mt-3 border-t border-borde pt-3 text-[11px] text-tenue">
          Puedes dejarlo configurado ahora. Empezará a operar cuando la Fase 2 habilite la
          ejecución, respetando el nivel que elijas.
        </p>
      ) : null}
    </Tarjeta>
  );
}

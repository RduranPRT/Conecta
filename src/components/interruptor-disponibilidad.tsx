"use client";

import { useTransition } from "react";

import { accionDisponibilidad } from "@/app/acciones";
import { cn } from "@/lib/utils";

/**
 * El ejemplo del prompt, hecho botón: al cambiar aquí, el estado se refleja de
 * inmediato en buscador, mapa, ficha, feed, matching y oportunidades, porque
 * todos leen la misma columna.
 */
export function InterruptorDisponibilidad({ disponible }: { disponible: boolean }) {
  const [pendiente, iniciar] = useTransition();

  return (
    <button
      type="button"
      disabled={pendiente}
      onClick={() => iniciar(() => void accionDisponibilidad(!disponible))}
      aria-pressed={disponible}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
        disponible
          ? "border-exito/30 bg-exito/10 text-exito"
          : "border-borde bg-superficie text-tenue hover:bg-superficie2",
        pendiente && "opacity-60",
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          disponible ? "bg-exito" : "bg-tenue/50",
        )}
      />
      {disponible ? "Disponible ahora" : "No disponible"}
    </button>
  );
}

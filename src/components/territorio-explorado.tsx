import { MapPin } from "lucide-react";

import { accionElegirTerritorio } from "@/app/acciones";
import { SelectorComuna, type Territorio } from "@/components/selector-comuna";
import type { TerritorioExplorado } from "@/lib/casos/territorio";
import { nombreTerritorio } from "@/lib/territorio";
import { cn } from "@/lib/utils";

/**
 * Qué territorio se está explorando y cómo cambiarlo (S20). Se recuerda en
 * este navegador y vale para Inicio, Buscar y el Mapa.
 */
export function IndicadorTerritorio({
  explorado,
  territorio,
  volver,
  className,
}: {
  explorado: TerritorioExplorado;
  territorio: Territorio;
  /** Ruta interna a la que se vuelve después de elegir. */
  volver: string;
  className?: string;
}) {
  const { comuna } = explorado;
  return (
    <details className={cn("group relative", className)}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full border border-borde bg-superficie px-2.5 py-1 text-xs text-tenue transition hover:bg-superficie2 [&::-webkit-details-marker]:hidden">
        <MapPin size={12} className="shrink-0 text-marca" />
        <span>
          Explorando:{" "}
          <strong className="font-medium text-texto">
            {comuna ? nombreTerritorio(comuna.nombre, comuna.regionNombre) : "todo Chile"}
          </strong>
          <span className="text-marca"> · Cambiar</span>
        </span>
      </summary>
      <form
        action={accionElegirTerritorio}
        className="tarjeta absolute left-0 top-9 z-[600] grid w-[min(20rem,calc(100vw-2rem))] gap-2 p-3 shadow-flotante"
      >
        <input type="hidden" name="volver" value={volver} />
        <SelectorComuna
          territorio={territorio}
          nombre="comuna"
          compacto
          idBase="explorar"
          etiqueta="¿Qué comuna quieres explorar?"
        />
        <button
          type="submit"
          className="h-10 rounded-lg bg-marca px-3 text-sm font-medium text-white transition hover:bg-marca-fuerte"
        >
          Explorar aquí
        </button>
        <button
          type="submit"
          name="todo"
          value="1"
          formNoValidate
          className="h-8 rounded-lg text-xs text-tenue transition hover:text-texto"
        >
          Ver todo Chile
        </button>
      </form>
    </details>
  );
}

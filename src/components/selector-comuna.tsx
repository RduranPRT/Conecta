"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export type OpcionRegion = { id: number; nombre: string };
export type OpcionComuna = {
  id: number;
  nombre: string;
  regionId: number;
  regionNombre: string;
  activa: boolean;
};

export type Territorio = { regiones: OpcionRegion[]; comunas: OpcionComuna[] };

/**
 * Selector territorial único: primero la región, luego la comuna. Las 346
 * comunas de Chile no caben en una lista plana; agrupadas por región sí.
 * Lo usan el registro, Mi perfil, Publicar, Buscar y el Mapa.
 */
export function SelectorComuna({
  territorio,
  nombre = "comunaId",
  inicial,
  requerido = false,
  compacto = false,
  idBase = "comuna",
  etiquetaVacia = "Selecciona tu comuna",
  alCambiar,
}: {
  territorio: Territorio;
  nombre?: string;
  inicial?: number | null;
  requerido?: boolean;
  compacto?: boolean;
  idBase?: string;
  etiquetaVacia?: string;
  alCambiar?: (comunaId: number | null) => void;
}) {
  const comunaInicial = territorio.comunas.find((c) => c.id === inicial) ?? null;
  const regionPorDefecto =
    comunaInicial?.regionId ??
    territorio.comunas.find((c) => c.activa)?.regionId ??
    territorio.regiones[0]?.id ??
    null;

  const [regionId, setRegionId] = useState<number | null>(regionPorDefecto);
  const [comunaId, setComunaId] = useState<number | null>(comunaInicial?.id ?? null);

  const comunasRegion = useMemo(
    () => territorio.comunas.filter((c) => c.regionId === regionId),
    [territorio.comunas, regionId],
  );

  const clase = compacto ? "campo h-9 py-1 text-xs" : "campo";

  return (
    <div className={cn("grid gap-2", compacto ? "" : "sm:grid-cols-2 sm:gap-3")}>
      <div>
        <label className={compacto ? "text-xs text-tenue" : "etiqueta"} htmlFor={`${idBase}-region`}>
          Región
        </label>
        <select
          id={`${idBase}-region`}
          className={clase}
          value={regionId ?? ""}
          onChange={(e) => {
            setRegionId(Number(e.target.value) || null);
            setComunaId(null);
            alCambiar?.(null);
          }}
        >
          {territorio.regiones.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={compacto ? "text-xs text-tenue" : "etiqueta"} htmlFor={`${idBase}-comuna`}>
          Comuna
        </label>
        <select
          id={`${idBase}-comuna`}
          name={nombre}
          className={clase}
          value={comunaId ?? ""}
          required={requerido}
          onChange={(e) => {
            const valor = Number(e.target.value) || null;
            setComunaId(valor);
            alCambiar?.(valor);
          }}
        >
          <option value="">{etiquetaVacia}</option>
          {comunasRegion.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
              {c.activa ? " · piloto" : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * Zona de cobertura: varias comunas donde además se atiende. Se agregan de a
 * una con el mismo selector territorial y se ven como etiquetas removibles.
 */
export function SelectorCobertura({
  territorio,
  inicial,
  nombre = "cobertura",
}: {
  territorio: Territorio;
  inicial: number[];
  nombre?: string;
}) {
  const [elegidas, setElegidas] = useState<number[]>(inicial);
  const [candidata, setCandidata] = useState<number | null>(null);
  const porId = useMemo(
    () => new Map(territorio.comunas.map((c) => [c.id, c])),
    [territorio.comunas],
  );

  return (
    <div className="space-y-3">
      {elegidas.length ? (
        <ul className="flex flex-wrap gap-2">
          {elegidas.map((id) => (
            <li key={id}>
              <input type="hidden" name={nombre} value={id} />
              <button
                type="button"
                onClick={() => setElegidas((prev) => prev.filter((v) => v !== id))}
                className="inline-flex items-center gap-1 rounded-full border border-marca bg-marca/10 px-3 py-1.5 text-xs text-marca transition hover:bg-marca/15"
                aria-label={`Quitar ${porId.get(id)?.nombre ?? "comuna"}`}
              >
                {porId.get(id)?.nombre ?? id}
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-tenue">Todavía no agregas otras comunas.</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <SelectorComuna
            territorio={territorio}
            nombre=""
            idBase="cobertura"
            compacto
            etiquetaVacia="Elige una comuna para agregar"
            alCambiar={setCandidata}
          />
        </div>
        <button
          type="button"
          disabled={!candidata || elegidas.includes(candidata)}
          onClick={() => {
            if (candidata && !elegidas.includes(candidata)) setElegidas((p) => [...p, candidata]);
          }}
          className="h-9 rounded-lg border border-borde bg-superficie px-3 text-xs font-medium text-texto transition hover:bg-superficie2 disabled:opacity-50"
        >
          Agregar comuna
        </button>
      </div>
    </div>
  );
}

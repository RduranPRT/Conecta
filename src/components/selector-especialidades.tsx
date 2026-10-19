"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";

import { cn, normalizar } from "@/lib/utils";

export type EspecialidadOpcion = {
  id: number;
  nombre: string;
  tipo: "servicio" | "producto" | "ambos";
  oficio: string | null;
  ejemplos: string | null;
  secundaria: boolean;
};

export type RubroOpcion = {
  id: number;
  slug: string;
  nombre: string;
  icono: string | null;
  ejemplos: string | null;
  especialidades: EspecialidadOpcion[];
};

/**
 * Elige qué ofreces: se recorre de rubro a especialidad o se busca escribiendo
 * (también por oficio: «electricista»). Una especialidad que vive en varios
 * rubros es la misma: marcarla en uno la marca en todos. Si no está, se
 * describe en «No encuentro mi actividad» y el perfil se completa igual.
 */
export function SelectorEspecialidades({
  rubros,
  inicial = [],
  otrasIniciales = [],
  tipos,
}: {
  rubros: RubroOpcion[];
  inicial?: number[];
  otrasIniciales?: string[];
  /** Si se indica, se muestran solo especialidades de estos tipos (y las «ambos»). */
  tipos?: ("servicio" | "producto")[];
}) {
  const [elegidas, setElegidas] = useState<number[]>(inicial);
  const [otras, setOtras] = useState<string[]>(otrasIniciales);
  const [textoOtra, setTextoOtra] = useState("");
  const [filtro, setFiltro] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);

  const visibles = useMemo(() => {
    const f = normalizar(filtro);
    return rubros
      .map((r) => ({
        ...r,
        especialidades: r.especialidades.filter((e) => {
          if (tipos?.length && e.tipo !== "ambos" && !tipos.includes(e.tipo)) return false;
          if (!f) return true;
          return [e.nombre, e.oficio ?? "", e.ejemplos ?? "", r.nombre].some((t) =>
            normalizar(t).includes(f),
          );
        }),
      }))
      .filter((r) => r.especialidades.length);
  }, [rubros, filtro, tipos]);

  const porId = useMemo(() => {
    const mapa = new Map<number, EspecialidadOpcion>();
    for (const r of rubros) for (const e of r.especialidades) mapa.set(e.id, e);
    return mapa;
  }, [rubros]);

  function alternar(id: number) {
    setElegidas((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  function agregarOtra() {
    const texto = textoOtra.trim();
    if (texto.length < 3 || otras.includes(texto)) return;
    setOtras((prev) => [...prev, texto]);
    setTextoOtra("");
  }

  return (
    <div className="space-y-3">
      {elegidas.map((id) => (
        <input key={id} type="hidden" name="categorias" value={id} />
      ))}
      {otras.map((t) => (
        <input key={t} type="hidden" name="otrasActividades" value={t} />
      ))}

      {elegidas.length || otras.length ? (
        <div>
          <p className="mb-1.5 text-xs font-medium text-texto">
            Elegiste {elegidas.length + otras.length}{" "}
            {elegidas.length + otras.length === 1 ? "actividad" : "actividades"}:
          </p>
          <ul className="flex flex-wrap gap-2">
            {elegidas.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => alternar(id)}
                  className="inline-flex items-center gap-1 rounded-full bg-marca px-3 py-1.5 text-xs text-white"
                  aria-label={`Quitar ${porId.get(id)?.nombre ?? ""}`}
                >
                  {porId.get(id)?.nombre}
                  <X size={12} />
                </button>
              </li>
            ))}
            {otras.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => setOtras((prev) => prev.filter((v) => v !== t))}
                  className="inline-flex items-center gap-1 rounded-full border border-marca px-3 py-1.5 text-xs text-marca"
                  aria-label={`Quitar ${t}`}
                >
                  {t} · otra
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tenue"
        />
        <input
          type="search"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Busca tu actividad: «abogado», «repuestos», «video»…"
          aria-label="Buscar actividad"
          className="campo pl-9"
        />
      </div>

      <ul className="divide-y divide-borde overflow-hidden rounded-xl border border-borde">
        {visibles.map((r) => {
          const desplegado = Boolean(filtro) || abierto === r.slug;
          const marcadas = r.especialidades.filter((e) => elegidas.includes(e.id)).length;
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setAbierto(desplegado && !filtro ? null : r.slug)}
                aria-expanded={desplegado}
                className="flex w-full items-center gap-3 bg-superficie px-3.5 py-3 text-left transition hover:bg-superficie2"
              >
                <span aria-hidden className="text-lg">
                  {r.icono}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-texto">{r.nombre}</span>
                  {r.ejemplos ? (
                    <span className="block truncate text-xs text-tenue">{r.ejemplos}</span>
                  ) : null}
                </span>
                {marcadas ? (
                  <span className="rounded-full bg-marca px-2 py-0.5 text-[10px] font-semibold text-white">
                    {marcadas}
                  </span>
                ) : null}
              </button>
              {desplegado ? (
                <div className="flex flex-wrap gap-2 bg-superficie2/60 px-3.5 py-3">
                  {r.especialidades.map((e) => {
                    const activo = elegidas.includes(e.id);
                    return (
                      <button
                        key={`${r.id}-${e.id}`}
                        type="button"
                        onClick={() => alternar(e.id)}
                        aria-pressed={activo}
                        title={e.ejemplos ?? undefined}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-left text-xs transition",
                          activo
                            ? "border-marca bg-marca text-white"
                            : "border-borde bg-superficie text-texto hover:bg-superficie2",
                        )}
                      >
                        {activo ? <Check size={12} /> : <Plus size={12} className="text-tenue" />}
                        {e.nombre}
                        {e.oficio ? (
                          <span className={activo ? "text-white/80" : "text-tenue"}>
                            · {e.oficio.toLowerCase()}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </li>
          );
        })}
        {!visibles.length ? (
          <li className="px-3.5 py-4 text-sm text-tenue">
            No encontramos «{filtro}». Descríbela abajo y la revisaremos.
          </li>
        ) : null}
      </ul>

      <div className="rounded-xl border border-dashed border-borde p-3">
        <label className="etiqueta" htmlFor="otra-actividad">
          ¿No encuentras tu actividad?
        </label>
        <p className="ayuda mb-2 mt-0">
          Escríbela con tus palabras. Tu perfil queda completo igual y el equipo la sumará a la
          lista.
        </p>
        <div className="flex gap-2">
          <input
            id="otra-actividad"
            value={textoOtra}
            onChange={(e) => setTextoOtra(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                agregarOtra();
              }
            }}
            placeholder="Ej.: restauración de vitrales"
            className="campo"
          />
          <button
            type="button"
            onClick={agregarOtra}
            disabled={textoOtra.trim().length < 3}
            className="shrink-0 rounded-xl border border-borde bg-superficie px-3 text-xs font-medium text-texto transition hover:bg-superficie2 disabled:opacity-50"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Lista desplegable de especialidades agrupadas por rubro. Cada especialidad
 * aparece una sola vez, bajo su rubro principal. Con `incluirRubros`, el rubro
 * completo también se puede elegir (para filtrar búsquedas).
 */
export function SelectCategoria({
  rubros,
  nombre = "categoriaId",
  id = "categoriaId",
  inicial,
  vacia = "Sin categoría",
  incluirRubros = false,
  className = "campo",
}: {
  rubros: RubroOpcion[];
  nombre?: string;
  id?: string;
  inicial?: number | string | null;
  vacia?: string;
  incluirRubros?: boolean;
  className?: string;
}) {
  return (
    <select id={id} name={nombre} className={className} defaultValue={inicial ?? ""}>
      <option value="">{vacia}</option>
      {rubros.map((r) => (
        <optgroup key={r.id} label={r.nombre}>
          {incluirRubros ? <option value={r.id}>Todo {r.nombre.toLowerCase()}</option> : null}
          {r.especialidades
            .filter((e) => !e.secundaria)
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}

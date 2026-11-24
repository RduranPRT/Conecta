"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";

import { cn, normalizar } from "@/lib/utils";

type Hoja = {
  id: number;
  nombre: string;
  nivel: "item" | "oficio";
  tipo: "servicio" | "producto" | "ambos";
  sinonimos: string[];
};

type Subgrupo = {
  id: number;
  slug: string;
  nombre: string;
  tipo: "servicio" | "producto" | "ambos";
  ejemplos: string | null;
  sinonimos: string[];
  items: Hoja[];
  oficios: Hoja[];
};

export type RubroOpcion = {
  id: number;
  slug: string;
  nombre: string;
  icono: string | null;
  ejemplos: string | null;
  subgrupos: Subgrupo[];
};

/**
 * Elige qué ofreces: rubro → subgrupo → lo concreto, o escribiendo. Se puede
 * marcar un ítem, un oficio o el subgrupo completo. Lo que cuelga de varios
 * lugares es lo mismo: marcarlo en uno lo marca en todos (C02). Si no está, se
 * describe en «Otro» y el perfil se completa igual (S11).
 */
export function SelectorActividades({
  rubros,
  inicial = [],
  otrasIniciales = [],
  tipos,
}: {
  rubros: RubroOpcion[];
  inicial?: number[];
  otrasIniciales?: string[];
  /** Si se indica, solo se muestra lo de estos tipos (S16). */
  tipos?: ("servicio" | "producto")[];
}) {
  const [elegidas, setElegidas] = useState<number[]>(inicial);
  const [otras, setOtras] = useState<string[]>(otrasIniciales);
  const [textoOtra, setTextoOtra] = useState("");
  const [filtro, setFiltro] = useState("");
  const [rubroAbierto, setRubroAbierto] = useState<string | null>(null);
  const [subgrupoAbierto, setSubgrupoAbierto] = useState<number | null>(null);

  const permitido = useMemo(
    () => (tipo: Hoja["tipo"]) => !tipos?.length || tipo === "ambos" || tipos.includes(tipo),
    [tipos],
  );

  const nombres = useMemo(() => {
    const mapa = new Map<number, string>();
    for (const r of rubros) {
      for (const s of r.subgrupos) {
        mapa.set(s.id, `Todo ${s.nombre}`);
        for (const h of [...s.items, ...s.oficios]) mapa.set(h.id, h.nombre);
      }
    }
    return mapa;
  }, [rubros]);

  /** Coincidencias al escribir: cada cosa una sola vez. */
  const encontradas = useMemo(() => {
    const f = normalizar(filtro);
    if (f.length < 2) return null;
    const vistas = new Map<number, { id: number; nombre: string; en: string; puntaje: number }>();
    for (const r of rubros) {
      for (const s of r.subgrupos) {
        const candidatos = [
          { id: s.id, nombre: `Todo ${s.nombre}`, tipo: s.tipo, textos: [s.nombre, ...s.sinonimos], base: 1 },
          ...s.items.map((h) => ({ ...h, textos: [h.nombre, ...h.sinonimos], base: 0 })),
          ...s.oficios.map((h) => ({ ...h, textos: [h.nombre, ...h.sinonimos], base: 0 })),
        ];
        for (const c of candidatos) {
          if (vistas.has(c.id) || !permitido(c.tipo)) continue;
          const textos = c.textos.map(normalizar);
          const puntaje = textos.some((t) => t === f)
            ? 0
            : textos.some((t) => t.startsWith(f))
              ? 1
              : textos.some((t) => t.includes(f))
                ? 2
                : null;
          if (puntaje === null) continue;
          vistas.set(c.id, { id: c.id, nombre: c.nombre, en: s.nombre, puntaje: puntaje * 2 + c.base });
        }
      }
    }
    return [...vistas.values()].sort((a, b) => a.puntaje - b.puntaje).slice(0, 24);
  }, [filtro, rubros, permitido]);

  const visibles = useMemo(
    () =>
      rubros
        .map((r) => ({
          ...r,
          subgrupos: r.subgrupos
            .map((s) => ({
              ...s,
              items: s.items.filter((h) => permitido(h.tipo)),
              oficios: s.oficios.filter((h) => permitido(h.tipo)),
            }))
            .filter((s) => permitido(s.tipo) && (s.items.length || s.oficios.length)),
        }))
        .filter((r) => r.subgrupos.length),
    [rubros, permitido],
  );

  function alternar(id: number) {
    setElegidas((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  function agregarOtra() {
    const texto = textoOtra.trim();
    if (texto.length < 3 || otras.includes(texto)) return;
    setOtras((prev) => [...prev, texto]);
    setTextoOtra("");
  }

  function Opcion({ id, nombre, nota }: { id: number; nombre: string; nota?: string }) {
    const activo = elegidas.includes(id);
    return (
      <button
        type="button"
        onClick={() => alternar(id)}
        aria-pressed={activo}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-left text-xs transition",
          activo
            ? "border-marca bg-marca text-white"
            : "border-borde bg-superficie text-texto hover:bg-superficie2",
        )}
      >
        {activo ? <Check size={12} /> : <Plus size={12} className="shrink-0 text-tenue" />}
        {nombre}
        {nota ? <span className={activo ? "text-white/80" : "text-tenue"}>· {nota}</span> : null}
      </button>
    );
  }

  const total = elegidas.length + otras.length;

  return (
    <div className="space-y-3">
      {elegidas.map((id) => (
        <input key={id} type="hidden" name="categorias" value={id} />
      ))}
      {otras.map((t) => (
        <input key={t} type="hidden" name="otrasActividades" value={t} />
      ))}

      {total ? (
        <div>
          <p className="mb-1.5 text-xs font-medium text-texto">
            Elegiste {total} {total === 1 ? "actividad" : "actividades"}:
          </p>
          <ul className="flex flex-wrap gap-2">
            {elegidas.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => alternar(id)}
                  className="inline-flex items-center gap-1 rounded-full bg-marca px-3 py-1.5 text-xs text-white"
                  aria-label={`Quitar ${nombres.get(id) ?? ""}`}
                >
                  {nombres.get(id)}
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
                  {t} · otro
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
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          placeholder="Escribe qué haces o vendes: «contratos», «marraqueta»…"
          aria-label="Buscar actividad"
          className="campo pl-9"
        />
      </div>

      {encontradas ? (
        <div className="rounded-xl border border-borde p-3">
          {encontradas.length ? (
            <div className="flex flex-wrap gap-2">
              {encontradas.map((e) => (
                <Opcion key={e.id} id={e.id} nombre={e.nombre} nota={e.en} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-tenue">
              No encontramos «{filtro}». Escríbela abajo, en «Otro», y la revisaremos.
            </p>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-borde overflow-hidden rounded-xl border border-borde">
          {visibles.map((r) => {
            const desplegado = rubroAbierto === r.slug;
            const marcadas = new Set(
              r.subgrupos
                .flatMap((s) => [s.id, ...s.items.map((h) => h.id), ...s.oficios.map((h) => h.id)])
                .filter((id) => elegidas.includes(id)),
            ).size;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setRubroAbierto(desplegado ? null : r.slug)}
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
                  <ChevronDown
                    size={16}
                    className={cn("shrink-0 text-tenue transition", desplegado && "rotate-180")}
                  />
                </button>
                {desplegado ? (
                  <ul className="divide-y divide-borde/60 bg-superficie2/60">
                    {r.subgrupos.map((s) => {
                      const abierto = subgrupoAbierto === s.id;
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => setSubgrupoAbierto(abierto ? null : s.id)}
                            aria-expanded={abierto}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm text-texto">{s.nombre}</span>
                              <span className="block truncate text-xs text-tenue">{s.ejemplos}</span>
                            </span>
                            <ChevronDown
                              size={14}
                              className={cn("shrink-0 text-tenue transition", abierto && "rotate-180")}
                            />
                          </button>
                          {abierto ? (
                            <div className="space-y-2 px-4 pb-3">
                              <div className="flex flex-wrap gap-2">
                                <Opcion id={s.id} nombre={`Todo ${s.nombre}`} />
                                {s.items.map((h) => (
                                  <Opcion key={h.id} id={h.id} nombre={h.nombre} />
                                ))}
                              </div>
                              {s.oficios.length ? (
                                <div>
                                  <p className="mb-1.5 text-[11px] text-tenue">
                                    O por tu oficio (opcional):
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {s.oficios.map((h) => (
                                      <Opcion key={h.id} id={h.id} nombre={h.nombre} />
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="rounded-xl border border-dashed border-borde p-3">
        <label className="etiqueta" htmlFor="otra-actividad">
          Otro: ¿no encuentras tu actividad?
        </label>
        <p className="ayuda mb-2 mt-0">
          Escríbela con tus palabras. Tu perfil queda completo igual, te encuentran por ese texto y
          el equipo la sumará a la lista.
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

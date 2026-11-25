"use client";

import { useId, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { cn, normalizar } from "@/lib/utils";

/** Forma compacta de una categoría para elegir una sola. */
export type OpcionCategoria = {
  id: number;
  nombre: string;
  nivel: "rubro" | "subgrupo" | "item" | "oficio";
  /** Dónde está: «Gasfitería», «Hogar y oficina». */
  en: string;
  alias: string[];
};

/**
 * Elige una sola categoría escribiendo: el ítem concreto o, si no se sabe, el
 * subgrupo. Lo usan el catálogo, Publicar, el mapa y administración.
 */
export function SelectorCategoria({
  opciones,
  nombre = "categoriaId",
  id = "categoriaId",
  inicial,
  niveles = ["item", "subgrupo"],
  placeholder = "Escribe para buscar",
  compacto = false,
}: {
  opciones: OpcionCategoria[];
  nombre?: string;
  id?: string;
  inicial?: number | null;
  niveles?: OpcionCategoria["nivel"][];
  placeholder?: string;
  compacto?: boolean;
}) {
  const lista = `${useId()}-lista`;
  const [elegida, setElegida] = useState(opciones.find((o) => o.id === inicial) ?? null);
  const [texto, setTexto] = useState(elegida?.nombre ?? "");
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(0);

  const visibles = useMemo(() => {
    const q = normalizar(texto);
    const permitidas = opciones.filter((o) => niveles.includes(o.nivel));
    if (!q) return permitidas.filter((o) => o.nivel !== "item").slice(0, 40);
    return permitidas
      .flatMap((o) => {
        const textos = [o.nombre, ...o.alias].map(normalizar);
        const p = textos.some((t) => t === q)
          ? 0
          : textos.some((t) => t.startsWith(q))
            ? 1
            : textos.some((t) => t.includes(q))
              ? 2
              : null;
        return p === null ? [] : [{ o, p: p + (o.nivel === "item" ? 0 : 0.5) }];
      })
      .sort((a, b) => a.p - b.p)
      .slice(0, 30)
      .map((x) => x.o);
  }, [opciones, niveles, texto]);

  function elegir(o: OpcionCategoria) {
    setElegida(o);
    setTexto(o.nombre);
    setAbierto(false);
  }

  return (
    <div className="relative">
      <input type="hidden" name={nombre} value={elegida?.id ?? ""} />
      <Search
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tenue"
      />
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={abierto && visibles.length > 0}
        aria-controls={lista}
        aria-autocomplete="list"
        autoComplete="off"
        className={cn("campo pl-9 pr-9", compacto && "h-10 py-1")}
        placeholder={placeholder}
        value={texto}
        onFocus={() => setAbierto(true)}
        onBlur={() =>
          setTimeout(() => {
            setAbierto(false);
            // Texto a medio escribir: vuelve a lo elegido, para no enviar otra cosa.
            setTexto((t) => (elegida && t !== elegida.nombre ? elegida.nombre : t));
          }, 150)
        }
        onChange={(e) => {
          setTexto(e.target.value);
          setElegida(null);
          setActiva(0);
          setAbierto(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setAbierto(true);
            setActiva((a) => Math.min(a + 1, visibles.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiva((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && abierto && !elegida && visibles.length) {
            e.preventDefault();
            elegir(visibles[activa] ?? visibles[0]);
          } else if (e.key === "Escape") setAbierto(false);
        }}
      />
      {texto ? (
        <button
          type="button"
          onClick={() => {
            setElegida(null);
            setTexto("");
          }}
          aria-label="Borrar categoría"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-tenue transition hover:bg-superficie2"
        >
          <X size={15} />
        </button>
      ) : null}
      {abierto && !elegida ? (
        <ul
          id={lista}
          role="listbox"
          aria-label="Categorías"
          className="tarjeta absolute inset-x-0 top-full z-[700] mt-1 max-h-60 overflow-y-auto py-1 shadow-flotante"
        >
          {visibles.map((o, i) => (
            <li
              key={o.id}
              role="option"
              aria-selected={i === activa}
              onMouseDown={(e) => {
                e.preventDefault();
                elegir(o);
              }}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm text-texto",
                i === activa ? "bg-marca/10" : "hover:bg-superficie2",
              )}
            >
              {o.nivel === "item" || o.nivel === "oficio" ? o.nombre : `Todo ${o.nombre}`}
              {o.en ? <span className="text-xs text-tenue"> · {o.en}</span> : null}
            </li>
          ))}
          {!visibles.length ? (
            <li className="px-3 py-2 text-sm text-tenue">
              No encontramos «{texto}». Puedes dejarlo vacío.
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

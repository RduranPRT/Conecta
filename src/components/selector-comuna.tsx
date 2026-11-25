"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";

import { filtrarComunas, nombreTerritorio } from "@/lib/territorio";
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
 * Selector territorial único (P01): se escribe el nombre y se elige de la
 * lista, sin distinguir tildes ni mayúsculas. Lo usan el registro, Mi perfil,
 * Publicar, Inicio, Buscar y el Mapa.
 */
export function SelectorComuna({
  territorio,
  nombre = "comunaId",
  inicial,
  requerido = false,
  compacto = false,
  idBase = "comuna",
  etiqueta = "Comuna",
  alCambiar,
}: {
  territorio: Territorio;
  nombre?: string;
  inicial?: number | null;
  requerido?: boolean;
  compacto?: boolean;
  idBase?: string;
  etiqueta?: string;
  alCambiar?: (comunaId: number | null) => void;
}) {
  const unico = useId();
  const lista = `${idBase}-${unico}-lista`;
  const campo = useRef<HTMLInputElement>(null);
  const comunaInicial = territorio.comunas.find((c) => c.id === inicial) ?? null;

  const [elegida, setElegida] = useState<OpcionComuna | null>(comunaInicial);
  const [texto, setTexto] = useState(
    comunaInicial ? nombreTerritorio(comunaInicial.nombre, comunaInicial.regionNombre) : "",
  );
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(0);

  const opciones = useMemo(
    () => (elegida ? [] : filtrarComunas(territorio.comunas, texto)),
    [territorio.comunas, texto, elegida],
  );

  // El campo visible es texto libre: si no se eligió de la lista, el navegador
  // avisa junto al campo en vez de enviar algo que el servidor no entiende.
  useEffect(() => {
    const falta = !elegida && (requerido || texto.trim().length > 0);
    campo.current?.setCustomValidity(falta ? "Escribe tu comuna y elígela de la lista." : "");
  }, [elegida, requerido, texto]);

  function elegir(c: OpcionComuna) {
    setElegida(c);
    setTexto(nombreTerritorio(c.nombre, c.regionNombre));
    setAbierto(false);
    alCambiar?.(c.id);
  }

  function limpiar() {
    setElegida(null);
    setTexto("");
    alCambiar?.(null);
    campo.current?.focus();
  }

  return (
    <div className="relative">
      <label className={compacto ? "text-xs text-tenue" : "etiqueta"} htmlFor={`${idBase}-comuna`}>
        {etiqueta}
      </label>
      {nombre ? <input type="hidden" name={nombre} value={elegida?.id ?? ""} /> : null}
      <div className="relative">
        <MapPin
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tenue"
        />
        <input
          ref={campo}
          id={`${idBase}-comuna`}
          type="text"
          role="combobox"
          aria-expanded={abierto && opciones.length > 0}
          aria-controls={lista}
          aria-autocomplete="list"
          aria-activedescendant={
            abierto && opciones[activa] ? `${lista}-${opciones[activa].id}` : undefined
          }
          autoComplete="off"
          className={cn("campo pl-9 pr-9", compacto && "h-10 py-1")}
          placeholder="Escribe tu comuna"
          value={texto}
          required={requerido}
          onFocus={(e) => {
            setAbierto(true);
            if (elegida) e.target.select();
          }}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          onChange={(e) => {
            setTexto(e.target.value);
            if (elegida) {
              setElegida(null);
              alCambiar?.(null);
            }
            setActiva(0);
            setAbierto(true);
          }}
          onKeyDown={(e) => {
            if (!opciones.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setAbierto(true);
              setActiva((a) => Math.min(a + 1, opciones.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiva((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && abierto) {
              e.preventDefault();
              elegir(opciones[activa] ?? opciones[0]);
            } else if (e.key === "Escape") {
              setAbierto(false);
            }
          }}
        />
        {texto ? (
          <button
            type="button"
            onClick={limpiar}
            aria-label="Borrar comuna"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-tenue transition hover:bg-superficie2"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>

      {abierto && !elegida ? (
        <ul
          id={lista}
          role="listbox"
          aria-label="Comunas"
          className="tarjeta absolute inset-x-0 top-full z-[700] mt-1 max-h-60 overflow-y-auto py-1 shadow-flotante"
        >
          {opciones.map((c, i) => (
            <li
              key={c.id}
              id={`${lista}-${c.id}`}
              role="option"
              aria-selected={i === activa}
              // mousedown: que el campo no pierda el foco antes de elegir.
              onMouseDown={(e) => {
                e.preventDefault();
                elegir(c);
              }}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm text-texto",
                i === activa ? "bg-marca/10" : "hover:bg-superficie2",
              )}
            >
              {c.nombre}
              <span className="text-xs text-tenue"> · {c.regionNombre}</span>
            </li>
          ))}
          {!opciones.length ? (
            <li className="px-3 py-2 text-sm text-tenue">
              No encontramos «{texto}». Revisa cómo está escrita.
            </li>
          ) : null}
        </ul>
      ) : null}
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
  // Cambiar la clave vacía el selector después de agregar.
  const [vuelta, setVuelta] = useState(0);
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

      <SelectorComuna
        key={vuelta}
        territorio={territorio}
        nombre=""
        idBase="cobertura"
        etiqueta="Agregar otra comuna"
        compacto
        alCambiar={(id) => {
          if (!id) return;
          setElegidas((p) => (p.includes(id) ? p : [...p, id]));
          setVuelta((v) => v + 1);
        }}
      />
    </div>
  );
}

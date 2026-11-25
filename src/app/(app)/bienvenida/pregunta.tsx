"use client";

import { useState } from "react";
import { Repeat2, Search, Store } from "lucide-react";

import { BotonEnlace } from "@/components/ui";
import { cn } from "@/lib/utils";

const OPCIONES = [
  {
    valor: "buscar",
    icono: Search,
    titulo: "Buscar",
    texto: "Encontrar y contratar lo que necesito.",
    boton: "Empezar a buscar",
    sigue: "Te llevamos al buscador.",
    href: "/",
  },
  {
    valor: "ofrecer",
    icono: Store,
    titulo: "Ofrecer",
    texto: "Mostrar mis servicios o productos.",
    boton: "Continuar: qué ofrezco",
    sigue: "Te preguntaremos tu comuna, qué ofreces y un teléfono.",
    href: "/completar?accion=ofrecer&next=%2Fmi-catalogo",
  },
  {
    valor: "ambas",
    icono: Repeat2,
    titulo: "Ambas",
    texto: "Busco cosas y también ofrezco.",
    boton: "Continuar: qué ofrezco",
    sigue: "Te preguntaremos tu comuna, qué ofreces y un teléfono.",
    href: "/completar?accion=ofrecer&next=%2F",
  },
] as const;

export function PreguntaInicial() {
  const [elegida, setElegida] = useState<(typeof OPCIONES)[number]["valor"] | null>(null);
  const opcion = OPCIONES.find((o) => o.valor === elegida);

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="¿Qué quieres hacer?">
        {OPCIONES.map(({ valor, icono: Icono, titulo, texto }) => (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={elegida === valor}
            onClick={() => setElegida(valor)}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3 text-left transition sm:flex-col sm:items-start",
              elegida === valor
                ? "border-marca bg-marca/10"
                : "border-borde bg-superficie hover:bg-superficie2",
            )}
          >
            <Icono size={20} className="shrink-0 text-marca" />
            <span>
              <span className="block text-sm font-medium text-texto">{titulo}</span>
              <span className="block text-xs text-tenue">{texto}</span>
            </span>
          </button>
        ))}
      </div>
      {opcion ? (
        <>
          <p className="text-xs text-tenue">{opcion.sigue}</p>
          <BotonEnlace href={opcion.href} className="w-full">
            {opcion.boton}
          </BotonEnlace>
        </>
      ) : null}
    </div>
  );
}

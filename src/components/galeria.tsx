"use client";

import { useState } from "react";

import type { ImagenPublica } from "@/lib/casos/imagenes";
import { cn } from "@/lib/utils";

/** Galería del detalle: la principal primero y el resto al tocarlas. */
export function Galeria({ fotos, nombre }: { fotos: ImagenPublica[]; nombre: string }) {
  const [elegida, setElegida] = useState(fotos.find((f) => f.esPrincipal)?.id ?? fotos[0]?.id);
  const actual = fotos.find((f) => f.id === elegida) ?? fotos[0];
  if (!actual) return null;

  return (
    <div data-testid="galeria">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={actual.url}
        alt={nombre}
        width={actual.ancho}
        height={actual.alto}
        className="max-h-[26rem] w-full bg-superficie2 object-contain"
      />
      {fotos.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto p-3">
          {fotos.map((f, i) => (
            <li key={f.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setElegida(f.id)}
                aria-label={`Ver foto ${i + 1} de ${fotos.length}`}
                aria-pressed={f.id === actual.id}
                className={cn(
                  "block overflow-hidden rounded-lg border-2 transition",
                  f.id === actual.id ? "border-marca" : "border-transparent opacity-75",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.miniatura} alt="" className="h-16 w-16 object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

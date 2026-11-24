"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const EJEMPLOS = [
  "Necesito un gasfíter que pueda venir hoy cerca de mí",
  "Busco proveedor de harina para mi panadería",
  "Mecánico disponible hoy",
  "200 cajas de tomates",
  "Abogado para revisar un contrato",
  "Filtro de aceite para mi auto",
];

/**
 * Un solo buscador para personas, prestadores, negocios, proveedores,
 * productores, servicios y productos. Acepta una palabra o una frase completa:
 * el intérprete se encarga del resto y el usuario no elige entre dos modos.
 */
export function BuscadorRapido({
  valorInicial = "",
  tamano = "md",
}: {
  valorInicial?: string;
  tamano?: "md" | "lg";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const parametros = useSearchParams();
  // En Buscar, la caja del encabezado muestra la consulta en curso.
  const [valor, setValor] = useState(valorInicial || parametros.get("q") || "");
  // El ejemplo se sortea en el navegador: si se sorteara al renderizar, el
  // servidor y el cliente mostrarían frases distintas (error de hidratación).
  const [ejemplo, setEjemplo] = useState(EJEMPLOS[0]);
  useEffect(() => {
    setEjemplo(EJEMPLOS[Math.floor(Math.random() * EJEMPLOS.length)]);
  }, []);

  function enviar(consulta: string) {
    const q = consulta.trim();
    if (!q) return;
    // Solo se conservan los filtros de búsqueda: otros parámetros de la pantalla
    // (tipo, zona, accion…) no significan lo mismo en los resultados.
    const destino = new URLSearchParams();
    for (const clave of ["comuna", "rol", "vista"]) {
      const v = parametros.get(clave);
      if (v && pathname === "/buscar") destino.set(clave, v);
    }
    destino.set("q", q);
    router.push(`/buscar?${destino.toString()}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        enviar(valor);
      }}
      className="w-full"
      role="search"
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tenue"
          size={tamano === "lg" ? 20 : 17}
        />
        <input
          name="q"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder={ejemplo}
          aria-label="Buscar en Conecta"
          className={
            tamano === "lg"
              ? "campo h-14 pl-11 pr-28 text-base shadow-tarjeta"
              : "campo h-10 pl-10 pr-10 text-sm"
          }
        />
        {tamano === "lg" ? (
          <button
            type="submit"
            className="absolute right-2 top-1/2 flex h-10 -translate-y-1/2 items-center gap-1.5 rounded-lg bg-marca px-4 text-sm font-medium text-white transition hover:bg-marca-fuerte"
          >
            <Sparkles size={15} />
            Buscar
          </button>
        ) : (
          <button
            type="submit"
            aria-label="Buscar"
            className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-tenue transition hover:bg-superficie2 hover:text-texto"
          >
            <Sparkles size={15} />
          </button>
        )}
      </div>
    </form>
  );
}

/**
 * Buscador del encabezado. En Inicio no se muestra: ahí el buscador es el
 * protagonista de la pantalla y dos cajas iguales confunden (S03).
 */
export function BuscadorEncabezado({ className }: { className?: string }) {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <div className={className}>
      <BuscadorRapido />
    </div>
  );
}

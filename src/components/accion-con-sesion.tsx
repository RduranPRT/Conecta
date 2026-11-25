"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useId, useRef } from "react";
import { X } from "lucide-react";

import { claseBoton, type VarianteBoton } from "@/components/ui";
import { conParametros, rutaIngreso } from "@/lib/destino";
import { cn } from "@/lib/utils";

/** Ruta actual con filtros, para volver exactamente al mismo lugar. */
function useRutaActual(ancla?: string) {
  const pathname = usePathname();
  const consulta = useSearchParams().toString();
  const ruta = `${pathname}${consulta ? `?${consulta}` : ""}`;
  return ancla ? conParametros(ruta, { ir: ancla }) : ruta;
}

/**
 * Aviso único para el visitante que intenta una acción con cuenta (N03). El
 * enlace funciona sin JavaScript: lleva a ingresar con el mismo retorno.
 */
export function EnlaceSinSesion({
  next,
  ancla,
  className,
  children,
  etiqueta,
}: {
  /** A dónde volver. Si se omite, a la pantalla actual con sus filtros. */
  next?: string;
  ancla?: string;
  className?: string;
  children: React.ReactNode;
  etiqueta?: string;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const titulo = useId();
  const actual = useRutaActual(ancla);
  const destino = next ?? actual;

  return (
    <>
      <a
        href={rutaIngreso(destino)}
        className={className}
        aria-label={etiqueta}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || !dialogo.current?.showModal) return;
          e.preventDefault();
          dialogo.current.showModal();
        }}
      >
        {children}
      </a>
      <dialog
        ref={dialogo}
        aria-labelledby={titulo}
        onClick={(e) => {
          if (e.target === dialogo.current) dialogo.current?.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-borde bg-superficie p-0 text-left text-texto shadow-flotante backdrop:bg-black/50"
      >
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <p id={titulo} className="text-base font-semibold">
              Inicia sesión o crea tu cuenta para continuar
            </p>
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              aria-label="Cerrar"
              className="rounded-lg p-1 text-tenue transition hover:bg-superficie2"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-tenue">
            Es gratis y toma un minuto. Después vuelves a este mismo lugar.
          </p>
          <div className="grid gap-2">
            <Link href={rutaIngreso(destino, "/registro")} className={claseBoton({ tamano: "md" })}>
              Crear mi cuenta
            </Link>
            <Link
              href={rutaIngreso(destino)}
              className={claseBoton({ variante: "secundario", tamano: "md" })}
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}

/**
 * Botón de una acción que necesita cuenta: con sesión es un enlace normal; sin
 * sesión avisa y, al ingresar, continúa en `href`.
 */
export function AccionConSesion({
  href,
  haySesion,
  variante,
  tamano,
  className,
  sinEstilo = false,
  children,
}: {
  href: string;
  haySesion: boolean;
  variante?: VarianteBoton["variante"];
  tamano?: VarianteBoton["tamano"];
  className?: string;
  sinEstilo?: boolean;
  children: React.ReactNode;
}) {
  const clase = sinEstilo ? className : cn(claseBoton({ variante, tamano }), className);
  return haySesion ? (
    <Link href={href} className={clase}>
      {children}
    </Link>
  ) : (
    <EnlaceSinSesion next={href} className={clase}>
      {children}
    </EnlaceSinSesion>
  );
}

/** Ingresar / Crear cuenta del encabezado: también vuelven a donde estabas. */
export function EnlacesIngreso() {
  const actual = useRutaActual();
  return (
    <>
      <Link
        href={rutaIngreso(actual)}
        className={claseBoton({ variante: "fantasma", tamano: "sm" })}
      >
        Ingresar
      </Link>
      <Link href={rutaIngreso(actual, "/registro")} className={claseBoton({ tamano: "sm" })}>
        Crear cuenta
      </Link>
    </>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Camera, ImagePlus, Star, Trash2 } from "lucide-react";

import {
  accionEliminarFoto,
  accionMarcarPrincipal,
  accionMoverFoto,
  accionQuitarFotoPerfil,
  accionSubirFotoItem,
  accionSubirFotoPerfil,
  type EstadoAccion,
} from "@/app/acciones";
import { Aviso, Avatar, Boton } from "@/components/ui";
import type { ImagenPublica } from "@/lib/casos/imagenes";

const MAXIMO_BYTES = 5 * 1024 * 1024;
const ACEPTA = "image/jpeg,image/png,image/webp";
const LIMITES = "JPG, PNG o WebP de hasta 5 MB.";

/** Aviso inmediato en el celular; el servidor vuelve a revisar todo. */
function revisar(archivo: File): string | null {
  if (archivo.size > MAXIMO_BYTES) return "La foto pesa más de 5 MB. Elige una más liviana.";
  return null;
}

function useCarga() {
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  function ejecutar(tarea: () => Promise<EstadoAccion>) {
    setError(null);
    iniciar(async () => {
      try {
        const r = await tarea();
        setError(r.error ?? null);
      } catch {
        setError("No se pudo completar. Revisa tu conexión e inténtalo de nuevo.");
      }
    });
  }
  return { error, setError, pendiente, ejecutar };
}

/* ── Perfil ───────────────────────────────────────────────────────────── */

export function FotoPerfil({ nombre, url }: { nombre: string; url: string | null }) {
  const entrada = useRef<HTMLInputElement>(null);
  const { error, setError, pendiente, ejecutar } = useCarga();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Avatar nombre={nombre} url={url} tamano={72} />
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-2">
            <Boton
              type="button"
              variante="secundario"
              tamano="sm"
              disabled={pendiente}
              onClick={() => entrada.current?.click()}
            >
              <Camera size={14} />
              {pendiente ? "Subiendo…" : url ? "Cambiar foto" : "Agregar foto"}
            </Boton>
            {url ? (
              <Boton
                type="button"
                variante="fantasma"
                tamano="sm"
                disabled={pendiente}
                onClick={() => ejecutar(accionQuitarFotoPerfil)}
              >
                Eliminar foto
              </Boton>
            ) : null}
          </div>
          <p className="text-xs text-tenue">Opcional. {LIMITES} Se ve sin cuenta.</p>
        </div>
      </div>
      <input
        ref={entrada}
        type="file"
        accept={ACEPTA}
        aria-label="Foto de perfil"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          e.target.value = "";
          if (!archivo) return;
          const problema = revisar(archivo);
          if (problema) return setError(problema);
          const datos = new FormData();
          datos.set("foto", archivo);
          ejecutar(() => accionSubirFotoPerfil(datos));
        }}
      />
      {error ? <Aviso tono="peligro">{error}</Aviso> : null}
    </div>
  );
}

/* ── Catálogo ─────────────────────────────────────────────────────────── */

export function FotosItem({
  itemId,
  fotos,
  maximo,
}: {
  itemId: number;
  fotos: ImagenPublica[];
  maximo: number;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const { error, setError, pendiente, ejecutar } = useCarga();

  async function subir(archivos: File[]): Promise<EstadoAccion> {
    // De a una: si una falla, las anteriores quedan y se dice cuál fue.
    for (const archivo of archivos) {
      const datos = new FormData();
      datos.set("foto", archivo);
      const r = await accionSubirFotoItem(itemId, datos);
      if (r.error) return archivos.length > 1 ? { error: `${archivo.name}: ${r.error}` } : r;
    }
    return { ok: true };
  }

  return (
    <section aria-labelledby="fotos-titulo" className="space-y-3">
      <div>
        <h2 id="fotos-titulo" className="text-base font-semibold text-texto">
          Fotos ({fotos.length} de {maximo})
        </h2>
        <p className="text-xs text-tenue">
          La principal aparece en el catálogo; las demás, en el detalle. {LIMITES}
        </p>
      </div>

      {error ? <Aviso tono="peligro">{error}</Aviso> : null}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {fotos.map((f, i) => (
          <li key={f.id} className="tarjeta overflow-hidden" data-testid="foto-item">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.miniatura}
                alt={`Foto ${i + 1}`}
                className="aspect-square w-full object-cover"
              />
              {f.esPrincipal ? (
                <span className="absolute left-2 top-2 rounded-md bg-marca px-1.5 py-0.5 text-[10px] font-bold text-superficie">
                  Principal
                </span>
              ) : null}
            </div>
            <div className="flex items-center justify-between px-1 py-1">
              <BotonIcono
                etiqueta="Mover antes"
                disabled={pendiente || i === 0}
                onClick={() => ejecutar(() => accionMoverFoto(f.id, -1))}
              >
                <ArrowLeft size={15} />
              </BotonIcono>
              <BotonIcono
                etiqueta="Mover después"
                disabled={pendiente || i === fotos.length - 1}
                onClick={() => ejecutar(() => accionMoverFoto(f.id, 1))}
              >
                <ArrowRight size={15} />
              </BotonIcono>
              <BotonIcono
                etiqueta="Marcar como principal"
                disabled={pendiente || f.esPrincipal}
                onClick={() => ejecutar(() => accionMarcarPrincipal(f.id))}
              >
                <Star size={15} fill={f.esPrincipal ? "currentColor" : "none"} />
              </BotonIcono>
              <BotonIcono
                etiqueta="Eliminar foto"
                disabled={pendiente}
                onClick={() => ejecutar(() => accionEliminarFoto(f.id))}
              >
                <Trash2 size={15} />
              </BotonIcono>
            </div>
          </li>
        ))}
        {fotos.length < maximo ? (
          <li>
            <button
              type="button"
              disabled={pendiente}
              onClick={() => entrada.current?.click()}
              className="grid aspect-square w-full place-items-center rounded-2xl border border-dashed border-borde text-tenue transition hover:bg-superficie2 disabled:opacity-60"
            >
              <span className="flex flex-col items-center gap-1 text-xs">
                <ImagePlus size={22} />
                {pendiente ? "Subiendo…" : fotos.length ? "Agregar otra" : "Agregar foto"}
              </span>
            </button>
          </li>
        ) : null}
      </ul>

      <input
        ref={entrada}
        type="file"
        accept={ACEPTA}
        multiple
        aria-label="Fotos del producto o servicio"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const archivos = [...(e.target.files ?? [])];
          e.target.value = "";
          if (!archivos.length) return;
          if (archivos.length > maximo - fotos.length) {
            return setError(
              `Puedes tener ${maximo} fotos como máximo (1 principal y ${maximo - 1} adicionales). Te quedan ${maximo - fotos.length}.`,
            );
          }
          const problema = archivos.map(revisar).find(Boolean);
          if (problema) return setError(problema);
          ejecutar(() => subir(archivos));
        }}
      />
    </section>
  );
}

function BotonIcono({
  etiqueta,
  children,
  ...props
}: { etiqueta: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      className="grid h-9 w-9 place-items-center rounded-lg text-tenue transition hover:bg-superficie2 hover:text-texto disabled:opacity-40"
      {...props}
    >
      {children}
    </button>
  );
}

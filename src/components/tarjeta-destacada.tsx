"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Bookmark, MapPin, Megaphone, Package, UserRound, Wrench } from "lucide-react";

import { accionAlternarGuardado } from "@/app/acciones";
import { Insignia } from "@/components/ui";
import { cn } from "@/lib/utils";

type Props = {
  publicacion: {
    id: number;
    tipo: string;
    titulo: string;
    imagenUrl: string | null;
    necesidadId: number | null;
  };
  autorNombre: string;
  autorSlug: string;
  comunaNombre: string | null;
  categoriaNombre: string | null;
  guardada: boolean;
  patrocinado: boolean;
  hayPerfil: boolean;
};

const ICONO_TIPO: Record<string, typeof Package> = {
  producto: Package,
  servicio: Wrench,
  oferta: Megaphone,
  oportunidad: Megaphone,
};

const ETIQUETA_TIPO: Record<string, string> = {
  producto: "Producto",
  servicio: "Servicio",
  oferta: "Oferta",
  oportunidad: "Oportunidad",
  necesidad: "Necesidad",
  novedad: "Novedad",
};

/**
 * Versión compacta de una publicación para «Publicaciones destacadas» en
 * Inicio (UX simplificada de Álvaro, sep-2026): imagen, tipo, título, lugar y
 * autor, con guardado directo. El detalle y las acciones completas siguen en
 * Descubrir y en la ficha del autor.
 */
export function TarjetaDestacada(props: Props) {
  const [pendiente, iniciar] = useTransition();
  const { publicacion: p } = props;
  const Icono = ICONO_TIPO[p.tipo] ?? UserRound;
  const destino =
    p.tipo === "necesidad" && p.necesidadId ? `/necesidades/${p.necesidadId}` : `/p/${props.autorSlug}`;

  return (
    <article className="tarjeta relative flex items-center gap-3 p-3 transition hover:shadow-flotante">
      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-marca/10 text-marca">
        {p.imagenUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imagenUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icono size={26} strokeWidth={1.6} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Insignia tono="marca">{ETIQUETA_TIPO[p.tipo] ?? p.tipo}</Insignia>
          {props.patrocinado ? <Insignia tono="alerta">Patrocinado</Insignia> : null}
        </div>
        <h3 className="mt-1 truncate text-sm font-medium text-texto">
          <Link href={destino} className="after:absolute after:inset-0">
            {p.titulo}
          </Link>
        </h3>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-tenue">
          <MapPin size={11} className="shrink-0" />
          {[props.comunaNombre, props.categoriaNombre].filter(Boolean).join(" · ") || "Sin comuna"}
        </p>
        <p className="truncate text-xs text-tenue">{props.autorNombre}</p>
      </div>

      <button
        type="button"
        disabled={!props.hayPerfil || pendiente}
        onClick={() => iniciar(() => void accionAlternarGuardado(p.id))}
        className={cn(
          "relative z-10 self-start rounded-lg p-1.5 transition",
          props.guardada ? "text-marca" : "text-tenue hover:bg-superficie2",
          !props.hayPerfil && "cursor-not-allowed opacity-50",
        )}
        aria-label={props.guardada ? "Quitar de guardados" : "Guardar"}
      >
        <Bookmark size={16} fill={props.guardada ? "currentColor" : "none"} />
      </button>
    </article>
  );
}

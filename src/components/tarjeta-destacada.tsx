import Link from "next/link";
import { MapPin, Megaphone, Package, UserRound, Wrench } from "lucide-react";

import { BotonGuardar } from "@/components/botones-publicacion";
import { EtiquetaSentido } from "@/components/etiqueta-sentido";
import { Insignia } from "@/components/ui";
import type { PublicacionPublica } from "@/lib/casos/feed";
import { ETIQUETA_TIPO } from "@/lib/publicaciones";

type Props = {
  publicacion: PublicacionPublica;
  autorNombre: string;
  comunaNombre: string | null;
  categoriaNombre: string | null;
  guardada: boolean;
  patrocinado: boolean;
  haySesion: boolean;
};

const ICONO_TIPO: Record<string, typeof Package> = {
  producto: Package,
  servicio: Wrench,
  oferta: Megaphone,
  oportunidad: Megaphone,
};

/**
 * Versión compacta de una publicación para «Publicaciones destacadas» en
 * Inicio (UX simplificada de Álvaro, sep-2026): imagen, sentido, título, lugar
 * y autor, con guardado directo.
 */
export function TarjetaDestacada(props: Props) {
  const { publicacion: p } = props;
  const Icono = ICONO_TIPO[p.tipo] ?? UserRound;
  const destino =
    p.tipo === "necesidad" && p.necesidadId
      ? `/necesidades/${p.necesidadId}`
      : `/publicaciones/${p.id}`;

  return (
    <article
      id={`pub-${p.id}`}
      className="tarjeta relative flex scroll-mt-32 items-center gap-3 p-3 transition hover:shadow-flotante"
    >
      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-marca/10 text-marca">
        {p.imagenUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imagenUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <Icono size={26} strokeWidth={1.6} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <EtiquetaSentido tipo={p.tipo} />
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

      <div className="relative z-10 self-start">
        <BotonGuardar publicacionId={p.id} guardada={props.guardada} haySesion={props.haySesion} />
      </div>
    </article>
  );
}

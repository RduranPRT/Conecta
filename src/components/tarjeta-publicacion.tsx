"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Heart, MapPin, MessageSquare } from "lucide-react";

import { accionReaccionar } from "@/app/acciones";
import { Avatar, BotonEnlace, Insignia } from "@/components/ui";
import { haceCuanto, monto as formatearMonto } from "@/lib/formato";
import { cn } from "@/lib/utils";

type Props = {
  publicacion: {
    id: number;
    tipo: string;
    titulo: string;
    cuerpo: string | null;
    precio: string | null;
    moneda: string;
    creadoEn: Date | string;
    necesidadId: number | null;
    autorPerfilId: number;
  };
  autorNombre: string;
  autorSlug: string;
  autorAvatar: string | null;
  comunaNombre: string | null;
  categoriaNombre: string | null;
  reacciones: number;
  reaccionada: boolean;
  patrocinado: boolean;
  motivo: string;
  hayPerfil: boolean;
};

/**
 * Toda publicación termina en una acción. El prompt lo pide explícitamente:
 * producto → comprar/cotizar/contactar; servicio → solicitar/cotizar/contactar;
 * necesidad → responder/enviar propuesta.
 */
function acciones(tipo: string, necesidadId: number | null, autorSlug: string) {
  switch (tipo) {
    case "necesidad":
      return necesidadId
        ? [
            { etiqueta: "Enviar propuesta", href: `/necesidades/${necesidadId}`, primario: true },
            { etiqueta: "Ver detalle", href: `/necesidades/${necesidadId}`, primario: false },
          ]
        : [];
    case "producto":
      return [
        { etiqueta: "Cotizar", href: `/publicar?tipo=necesidad&para=${autorSlug}`, primario: true },
        { etiqueta: "Contactar", href: `/p/${autorSlug}#contacto`, primario: false },
      ];
    case "servicio":
      return [
        {
          etiqueta: "Solicitar servicio",
          href: `/publicar?tipo=necesidad&para=${autorSlug}`,
          primario: true,
        },
        { etiqueta: "Contactar", href: `/p/${autorSlug}#contacto`, primario: false },
      ];
    case "oferta":
    case "oportunidad":
      return [{ etiqueta: "Me interesa", href: `/p/${autorSlug}#contacto`, primario: true }];
    default:
      return [{ etiqueta: "Ver perfil", href: `/p/${autorSlug}`, primario: false }];
  }
}

const TONO_TIPO: Record<string, "marca" | "acento" | "neutro" | "exito"> = {
  necesidad: "acento",
  producto: "marca",
  servicio: "marca",
  oferta: "exito",
  oportunidad: "exito",
  novedad: "neutro",
};

export function TarjetaPublicacion(props: Props) {
  const [pendiente, iniciar] = useTransition();
  const { publicacion: p } = props;
  const botones = acciones(p.tipo, p.necesidadId, props.autorSlug);

  return (
    <article className="tarjeta p-4 sm:p-5">
      <header className="flex items-start gap-3">
        <Avatar nombre={props.autorNombre} url={props.autorAvatar} tamano={40} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/p/${props.autorSlug}`}
              className="truncate text-sm font-semibold text-texto hover:text-marca"
            >
              {props.autorNombre}
            </Link>
            <Insignia tono={TONO_TIPO[p.tipo] ?? "neutro"}>{p.tipo}</Insignia>
            {props.patrocinado ? <Insignia tono="alerta">Patrocinado</Insignia> : null}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-tenue">
            <span>{haceCuanto(p.creadoEn)}</span>
            {props.comunaNombre ? (
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} />
                {props.comunaNombre}
              </span>
            ) : null}
            {props.categoriaNombre ? <span>· {props.categoriaNombre}</span> : null}
          </p>
        </div>
      </header>

      <h3 className="mt-3 text-[15px] font-medium text-texto">{p.titulo}</h3>
      {p.cuerpo ? <p className="mt-1 whitespace-pre-line text-sm text-tenue">{p.cuerpo}</p> : null}

      {p.precio ? (
        <p className="mt-3 text-lg font-semibold text-texto">
          {formatearMonto(p.precio, p.moneda)}
        </p>
      ) : null}

      <footer className="mt-4 flex flex-wrap items-center gap-2">
        {botones.map((b) => (
          <BotonEnlace
            key={b.etiqueta}
            href={b.href}
            tamano="sm"
            variante={b.primario ? "primario" : "secundario"}
          >
            {b.etiqueta}
          </BotonEnlace>
        ))}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            disabled={!props.hayPerfil || pendiente}
            onClick={() => iniciar(() => void accionReaccionar(p.id))}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition",
              props.reaccionada ? "text-peligro" : "text-tenue hover:bg-superficie2",
              !props.hayPerfil && "cursor-not-allowed opacity-50",
            )}
            aria-label="Me interesa"
          >
            <Heart size={14} fill={props.reaccionada ? "currentColor" : "none"} />
            {props.reacciones}
          </button>
          <Link
            href={`/p/${props.autorSlug}#contacto`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-tenue transition hover:bg-superficie2"
            aria-label="Escribir"
          >
            <MessageSquare size={14} />
          </Link>
        </div>
      </footer>

      {props.motivo ? (
        <p className="mt-3 border-t border-borde pt-2 text-[11px] text-tenue">
          Te aparece porque: {props.motivo}
        </p>
      ) : null}
    </article>
  );
}

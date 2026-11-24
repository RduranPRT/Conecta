import Link from "next/link";
import { MapPin } from "lucide-react";

import { AccionConSesion } from "@/components/accion-con-sesion";
import { BotonGuardar, BotonReaccion } from "@/components/botones-publicacion";
import { EtiquetaSentido } from "@/components/etiqueta-sentido";
import { Avatar, BotonEnlace, Insignia } from "@/components/ui";
import type { PublicacionPublica } from "@/lib/casos/feed";
import { haceCuanto, monto as formatearMonto } from "@/lib/formato";
import { accionesDe, ETIQUETA_TIPO, TONO_TIPO } from "@/lib/publicaciones";

type Props = {
  publicacion: PublicacionPublica;
  autorNombre: string;
  autorSlug: string;
  autorAvatar: string | null;
  comunaNombre: string | null;
  categoriaNombre: string | null;
  reacciones: number;
  reaccionada: boolean;
  guardada: boolean;
  patrocinado: boolean;
  motivo: string;
  haySesion: boolean;
};

/**
 * Toda publicación termina en una acción. Con cuenta se ejecuta; sin cuenta,
 * se explica qué falta y se vuelve al mismo punto (N03).
 */
export function TarjetaPublicacion(props: Props) {
  const { publicacion: p } = props;

  return (
    <article id={`pub-${p.id}`} className="tarjeta scroll-mt-32 p-4 sm:p-5">
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
            <EtiquetaSentido tipo={p.tipo} />
            <Insignia tono={TONO_TIPO[p.tipo] ?? "neutro"}>{ETIQUETA_TIPO[p.tipo] ?? p.tipo}</Insignia>
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

      <h3 className="mt-3 text-[15px] font-medium text-texto">
        <Link href={`/publicaciones/${p.id}`} className="hover:text-marca">
          {p.titulo}
        </Link>
      </h3>
      {p.imagenUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.imagenUrl}
          alt=""
          loading="lazy"
          className="mt-3 max-h-72 w-full rounded-xl border border-borde object-cover"
        />
      ) : null}
      {p.cuerpo ? <p className="mt-1 whitespace-pre-line text-sm text-tenue">{p.cuerpo}</p> : null}

      {p.precio ? (
        <p className="mt-3 text-lg font-semibold text-texto">
          {formatearMonto(p.precio, p.moneda)}
        </p>
      ) : null}

      <footer className="mt-4 flex flex-wrap items-center gap-2">
        {accionesDe(p.tipo, p.necesidadId, props.autorSlug).map((a) =>
          a.conCuenta ? (
            <AccionConSesion
              key={a.etiqueta}
              href={a.href}
              haySesion={props.haySesion}
              tamano="sm"
              variante={a.primario ? "primario" : "secundario"}
            >
              {a.etiqueta}
            </AccionConSesion>
          ) : (
            <BotonEnlace
              key={a.etiqueta}
              href={a.href}
              tamano="sm"
              variante={a.primario ? "primario" : "secundario"}
            >
              {a.etiqueta}
            </BotonEnlace>
          ),
        )}

        <div className="ml-auto flex items-center gap-1">
          <BotonReaccion
            publicacionId={p.id}
            reacciones={props.reacciones}
            reaccionada={props.reaccionada}
            haySesion={props.haySesion}
          />
          <BotonGuardar publicacionId={p.id} guardada={props.guardada} haySesion={props.haySesion} />
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

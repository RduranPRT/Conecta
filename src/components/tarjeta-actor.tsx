import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";

import { Avatar, BotonEnlace, Estrellas, Insignia } from "@/components/ui";
import type { ActorResumen } from "@/lib/casos/actores";
import { formatearDistancia } from "@/lib/geo";

const ETIQUETA_ROL: Record<string, string> = {
  persona: "Persona",
  prestador: "Prestador de servicios",
  negocio: "Negocio",
  proveedor: "Proveedor",
  productor: "Productor",
};

export function TarjetaActor({
  actor,
  accion,
}: {
  actor: ActorResumen;
  accion?: React.ReactNode;
}) {
  return (
    <article className="tarjeta flex gap-4 p-4 transition hover:shadow-flotante">
      <Avatar nombre={actor.nombre} url={actor.avatarUrl} tamano={48} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={`/p/${actor.slug}`}
            className="truncate text-[15px] font-semibold text-texto hover:text-marca"
          >
            {actor.nombre}
          </Link>
          {actor.verificado ? (
            <span title="Perfil verificado" className="text-marca">
              <BadgeCheck size={16} />
            </span>
          ) : null}
          {actor.disponibleAhora ? (
            <Insignia tono="exito">Disponible ahora</Insignia>
          ) : null}
        </div>

        <p className="mt-0.5 text-xs text-tenue">
          {actor.roles.map((r) => ETIQUETA_ROL[r] ?? r).join(" · ") || "Perfil"}
        </p>

        {actor.descripcion ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-tenue">{actor.descripcion}</p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-tenue">
          {actor.comunaNombre ? (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} />
              {actor.comunaNombre}
              {actor.distanciaKm !== null ? ` · ${formatearDistancia(actor.distanciaKm)}` : ""}
            </span>
          ) : null}
          <Estrellas valor={actor.reputacionPromedio} conteo={actor.reputacionConteo} />
          {actor.categorias.slice(0, 2).map((c) => (
            <Insignia key={c.id} tono="contorno">
              {c.nombre}
            </Insignia>
          ))}
        </div>

        {actor.motivo ? (
          <p className="mt-2 text-[11px] text-marca">Por qué aparece: {actor.motivo}</p>
        ) : null}
      </div>

      <div className="flex flex-col items-end justify-between gap-2">
        {accion ?? (
          <BotonEnlace href={`/p/${actor.slug}`} variante="secundario" tamano="sm">
            Ver ficha
          </BotonEnlace>
        )}
      </div>
    </article>
  );
}

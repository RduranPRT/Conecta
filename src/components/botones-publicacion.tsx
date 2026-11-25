"use client";

import { useTransition } from "react";
import { Bookmark, Heart } from "lucide-react";

import { accionAlternarGuardado, accionReaccionar } from "@/app/acciones";
import { EnlaceSinSesion } from "@/components/accion-con-sesion";
import { cn } from "@/lib/utils";

/** Guardar una publicación. Sin sesión, avisa y vuelve a esta misma tarjeta. */
export function BotonGuardar({
  publicacionId,
  guardada,
  haySesion,
  className,
}: {
  publicacionId: number;
  guardada: boolean;
  haySesion: boolean;
  className?: string;
}) {
  const [pendiente, iniciar] = useTransition();
  const clase = cn(
    "inline-flex items-center gap-1.5 rounded-lg p-1.5 text-xs transition",
    guardada ? "text-marca" : "text-tenue hover:bg-superficie2",
    className,
  );

  if (!haySesion) {
    return (
      <EnlaceSinSesion ancla={`pub-${publicacionId}`} className={clase} etiqueta="Guardar">
        <Bookmark size={16} />
      </EnlaceSinSesion>
    );
  }
  return (
    <button
      type="button"
      disabled={pendiente}
      onClick={() => iniciar(() => void accionAlternarGuardado(publicacionId))}
      className={clase}
      aria-label={guardada ? "Quitar de guardados" : "Guardar"}
    >
      <Bookmark size={16} fill={guardada ? "currentColor" : "none"} />
    </button>
  );
}

export function BotonReaccion({
  publicacionId,
  reacciones,
  reaccionada,
  haySesion,
}: {
  publicacionId: number;
  reacciones: number;
  reaccionada: boolean;
  haySesion: boolean;
}) {
  const [pendiente, iniciar] = useTransition();
  const clase = cn(
    "inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition",
    reaccionada ? "text-peligro" : "text-tenue hover:bg-superficie2",
  );

  if (!haySesion) {
    return (
      <EnlaceSinSesion ancla={`pub-${publicacionId}`} className={clase} etiqueta="Me interesa">
        <Heart size={14} />
        {reacciones}
      </EnlaceSinSesion>
    );
  }
  return (
    <button
      type="button"
      disabled={pendiente}
      onClick={() => iniciar(() => void accionReaccionar(publicacionId))}
      className={clase}
      aria-label="Me interesa"
      aria-pressed={reaccionada}
    >
      <Heart size={14} fill={reaccionada ? "currentColor" : "none"} />
      {reacciones}
    </button>
  );
}

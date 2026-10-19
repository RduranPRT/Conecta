"use client";

import { useActionState, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { accionCrearPerfil, type EstadoAccion } from "@/app/acciones";
import {
  ROLES_QUE_OFRECEN,
  SeccionActividades,
  SeccionIdentidad,
  SeccionOferta,
  SeccionUbicacion,
} from "@/components/campos-ficha";
import type { Territorio } from "@/components/selector-comuna";
import type { RubroOpcion } from "@/components/selector-especialidades";
import { Aviso, Boton } from "@/components/ui";
import { cn } from "@/lib/utils";

const PASOS = [
  { titulo: "¿Quién eres y qué quieres hacer?", ayuda: "Con esto armamos tu cuenta." },
  { titulo: "¿Dónde estás?", ayuda: "Para mostrarte lo que está cerca y que te encuentren." },
  { titulo: "¿Qué ofreces?", ayuda: "Para que aparezcas cuando alguien busque lo que haces." },
];

/**
 * Registro en pasos cortos (S09): cada paso dice para qué sirve lo que pide y
 * cuál es el siguiente. Solo se pide lo mínimo (S04); teléfono, RUT o dirección
 * se piden después, cuando una acción los necesita (S05).
 */
export function FormularioPerfil({
  territorio,
  rubros,
  nombreSugerido,
}: {
  territorio: Territorio;
  rubros: RubroOpcion[];
  nombreSugerido: string;
}) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(
    accionCrearPerfil,
    {},
  );
  const formulario = useRef<HTMLFormElement>(null);
  const [paso, setPaso] = useState(0);
  const [roles, setRoles] = useState<string[]>(["persona"]);
  const [aviso, setAviso] = useState<string | null>(null);

  const ofrece = roles.some((r) => ROLES_QUE_OFRECEN.includes(r));
  const totalPasos = ofrece ? 3 : 2;
  const esUltimo = paso === totalPasos - 1;

  function faltaEnPaso(): string | null {
    const datos = new FormData(formulario.current!);
    if (paso === 0) {
      if (String(datos.get("nombre") ?? "").trim().length < 2) return "Escribe tu nombre o el de tu negocio.";
      if (!roles.length) return "Marca al menos una opción de lo que quieres hacer.";
    }
    if (paso === 1 && !datos.get("comunaId")) return "Elige tu región y tu comuna.";
    if (paso === 2 && !datos.getAll("categorias").length && !datos.getAll("otrasActividades").length) {
      return "Elige al menos una actividad o descríbela en «¿No encuentras tu actividad?».";
    }
    return null;
  }

  function avanzar() {
    const falta = faltaEnPaso();
    setAviso(falta);
    if (!falta) setPaso((p) => Math.min(p + 1, totalPasos - 1));
  }

  return (
    <form
      ref={formulario}
      action={enviar}
      onSubmit={(e) => {
        const falta = faltaEnPaso();
        if (!esUltimo || falta) {
          e.preventDefault();
          if (!esUltimo) avanzar();
          else setAviso(falta);
        }
      }}
      className="space-y-6"
    >
      <div>
        <div className="flex items-center justify-between text-xs text-tenue">
          <span>
            Paso {paso + 1} de {totalPasos}
          </span>
          <span>{esUltimo ? "Último paso" : `Sigue: ${PASOS[paso + 1].titulo.toLowerCase()}`}</span>
        </div>
        <div className="mt-2 flex gap-1.5" aria-hidden>
          {Array.from({ length: totalPasos }, (_, i) => (
            <span
              key={i}
              className={cn("h-1.5 flex-1 rounded-full", i <= paso ? "bg-marca" : "bg-borde")}
            />
          ))}
        </div>
        <h2 className="mt-4 text-lg font-semibold text-texto">{PASOS[paso].titulo}</h2>
        <p className="text-sm text-tenue">{PASOS[paso].ayuda}</p>
      </div>

      {estado?.error ? <Aviso tono="peligro">{estado.error}</Aviso> : null}
      {aviso ? <Aviso tono="alerta">{aviso}</Aviso> : null}

      <div className={cn("space-y-6", paso !== 0 && "hidden")}>
        <SeccionIdentidad inicial={{ nombre: nombreSugerido }} />
        <SeccionActividades roles={roles} setRoles={setRoles} />
      </div>

      <div className={cn(paso !== 1 && "hidden")}>
        <SeccionUbicacion territorio={territorio} />
      </div>

      {ofrece ? (
        <div className={cn(paso !== 2 && "hidden")}>
          <SeccionOferta rubros={rubros} roles={roles} />
        </div>
      ) : null}

      <div className="sticky bottom-0 -mx-6 flex gap-3 border-t border-borde bg-superficie px-6 py-4 sm:-mx-8 sm:px-8">
        {paso > 0 ? (
          <Boton
            type="button"
            variante="secundario"
            onClick={() => {
              setAviso(null);
              setPaso((p) => p - 1);
            }}
          >
            <ArrowLeft size={16} />
            Atrás
          </Boton>
        ) : null}
        {/* Claves distintas: si React reutilizara el mismo botón y le cambiara el tipo a
            «submit» durante el clic de «Siguiente», el navegador enviaría el formulario. */}
        {esUltimo ? (
          <Boton key="crear" type="submit" className="flex-1" disabled={pendiente}>
            {pendiente ? "Creando tu perfil…" : "Crear mi perfil"}
          </Boton>
        ) : (
          <Boton key="siguiente" type="button" className="flex-1" onClick={avanzar}>
            Siguiente
            <ArrowRight size={16} />
          </Boton>
        )}
      </div>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Bot, SendHorizonal, Sparkles } from "lucide-react";

import { Boton, Insignia, Tarjeta } from "@/components/ui";
import type { RespuestaAsistente } from "@/lib/ia/asistente";

import { preguntarAsistente } from "./accion";

type Turno =
  | { rol: "usuario"; texto: string }
  | { rol: "asistente"; respuesta: RespuestaAsistente };

const SUGERENCIAS = [
  "Necesito un gasfíter que pueda venir hoy cerca de mí",
  "Consígueme más clientes esta semana",
  "¿Cómo van mis necesidades?",
  "Busco proveedor de harina",
];

export function Conversacion({ nombre }: { nombre: string }) {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [valor, setValor] = useState("");
  const [pendiente, iniciar] = useTransition();

  function preguntar(texto: string) {
    const consulta = texto.trim();
    if (!consulta) return;
    setValor("");
    setTurnos((t) => [...t, { rol: "usuario", texto: consulta }]);
    iniciar(async () => {
      const respuesta = await preguntarAsistente(consulta);
      setTurnos((t) => [...t, { rol: "asistente", respuesta }]);
    });
  }

  return (
    <div className="space-y-4">
      <Tarjeta className="flex min-h-[22rem] flex-col gap-4 p-5">
        {turnos.length === 0 ? (
          <div className="my-auto text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-marca/10 text-marca">
              <Bot size={22} />
            </span>
            <p className="mt-3 text-sm font-medium text-texto">
              Hola {nombre.split(" ")[0]}, ¿en qué te ayudo?
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs text-tenue">
              Puedo buscar en el territorio, revisar tu actividad y proponerte el siguiente paso.
              Cada respuesta sale de una consulta real a la plataforma.
            </p>
          </div>
        ) : null}

        {turnos.map((turno, i) =>
          turno.rol === "usuario" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[80%] rounded-2xl rounded-br-md bg-marca px-3.5 py-2.5 text-sm text-white">
                {turno.texto}
              </p>
            </div>
          ) : (
            <div key={i} className="flex gap-2.5">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-marca/10 text-marca">
                <Bot size={16} />
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm text-texto">{turno.respuesta.texto}</p>

                {turno.respuesta.detalle.length ? (
                  <ul className="space-y-1 text-sm text-tenue">
                    {turno.respuesta.detalle.map((d, j) => (
                      <li key={j} className="flex gap-2">
                        <span className="text-marca">·</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {turno.respuesta.acciones.length ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {turno.respuesta.acciones.map((a) => (
                      <Link
                        key={a.href}
                        href={a.href}
                        className="rounded-lg border border-borde bg-superficie px-3 py-1.5 text-xs text-texto transition hover:bg-superficie2"
                      >
                        {a.etiqueta}
                      </Link>
                    ))}
                  </div>
                ) : null}

                {turno.respuesta.interpretacion ? (
                  <p className="flex items-center gap-1.5 pt-1 text-[11px] text-tenue">
                    <Sparkles size={11} className="text-marca" />
                    {turno.respuesta.motor === "modelo" ? "Modelo" : "Reglas"} ·{" "}
                    {turno.respuesta.interpretacion}
                  </p>
                ) : null}
              </div>
            </div>
          ),
        )}

        {pendiente ? (
          <p className="flex items-center gap-2 text-xs text-tenue">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-marca" />
            Consultando la plataforma…
          </p>
        ) : null}
      </Tarjeta>

      {turnos.length === 0 ? (
        <div className="flex flex-wrap gap-2">
          {SUGERENCIAS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => preguntar(s)}
              className="rounded-full border border-borde bg-superficie px-3 py-1.5 text-xs text-tenue transition hover:bg-superficie2 hover:text-texto"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          preguntar(valor);
        }}
        className="flex items-end gap-2"
      >
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="campo flex-1"
          placeholder="Escribe lo que necesitas, como se lo dirías a alguien"
          aria-label="Mensaje para el asistente"
        />
        <Boton type="submit" disabled={pendiente} aria-label="Enviar">
          <SendHorizonal size={16} />
        </Boton>
      </form>

      <Insignia tono="contorno">
        El asistente propone; las acciones sensibles siguen siendo tuyas
      </Insignia>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar, Encabezado, Tarjeta } from "@/components/ui";
import { obtenerConversacion } from "@/lib/casos/mensajes";
import { fechaHora } from "@/lib/formato";
import { requerirPerfil } from "@/lib/sesion";
import { cn } from "@/lib/utils";

import { FormularioMensaje } from "./formulario";

export const metadata: Metadata = { title: "Conversación" };
export const dynamic = "force-dynamic";

export default async function PaginaConversacion({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversacionId = Number(id);
  if (Number.isNaN(conversacionId)) notFound();

  const perfil = await requerirPerfil(`/mensajes/${id}`);
  const datos = await obtenerConversacion(conversacionId, perfil.id);
  if (!datos) notFound();

  const otro = datos.participantes.find((p) => p.id !== perfil.id);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Encabezado
        titulo={otro?.nombre ?? "Conversación"}
        bajada={
          datos.conversacion.necesidadId ? (
            <Link
              href={`/necesidades/${datos.conversacion.necesidadId}`}
              className="text-marca hover:underline"
            >
              Sobre: {datos.conversacion.asunto ?? "la necesidad"} →
            </Link>
          ) : (
            datos.conversacion.asunto ?? undefined
          )
        }
      />

      <Tarjeta className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto p-4">
        {datos.mensajes.map(({ mensaje, autorNombre }) => {
          const mio = mensaje.autorPerfilId === perfil.id;
          return (
            <div
              key={mensaje.id}
              className={cn("flex items-end gap-2", mio && "flex-row-reverse")}
            >
              {!mio ? <Avatar nombre={autorNombre} tamano={28} /> : null}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm",
                  mio
                    ? "rounded-br-md bg-marca text-white"
                    : "rounded-bl-md bg-superficie2 text-texto",
                )}
              >
                <p className="whitespace-pre-line">{mensaje.cuerpo}</p>
                <p className={cn("mt-1 text-[10px]", mio ? "text-white/70" : "text-tenue")}>
                  {fechaHora(mensaje.creadoEn)}
                </p>
              </div>
            </div>
          );
        })}
      </Tarjeta>

      <FormularioMensaje conversacionId={conversacionId} />
    </div>
  );
}

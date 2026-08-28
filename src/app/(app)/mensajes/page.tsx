import type { Metadata } from "next";
import Link from "next/link";

import { Encabezado, Insignia, Tarjeta, Vacio } from "@/components/ui";
import { conversacionesDe } from "@/lib/casos/mensajes";
import { haceCuanto } from "@/lib/formato";
import { requerirPerfil } from "@/lib/sesion";

export const metadata: Metadata = { title: "Mensajes" };
export const dynamic = "force-dynamic";

export default async function PaginaMensajes() {
  const perfil = await requerirPerfil("/mensajes");
  const conversaciones = await conversacionesDe(perfil.id);

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Mensajes"
        bajada="La conversación de cada operación queda junto a su necesidad, para que la traza no se pierda en otro canal."
      />

      {conversaciones.length ? (
        <Tarjeta className="divide-y divide-borde">
          {conversaciones.map((c) => (
            <Link
              key={c.conversacion.id}
              href={`/mensajes/${c.conversacion.id}`}
              className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-superficie2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-texto">
                    {c.otro ?? "Conversación"}
                  </p>
                  {Number(c.sinLeer) > 0 ? (
                    <Insignia tono="marca">{Number(c.sinLeer)} sin leer</Insignia>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-xs text-tenue">
                  {c.conversacion.asunto ? `${c.conversacion.asunto} · ` : ""}
                  {c.ultimoMensaje ?? "Sin mensajes"}
                </p>
              </div>
              <span className="shrink-0 text-xs text-tenue">
                {c.ultimaFecha ? haceCuanto(c.ultimaFecha) : ""}
              </span>
            </Link>
          ))}
        </Tarjeta>
      ) : (
        <Vacio
          titulo="No tienes conversaciones"
          descripcion="Se abren solas cuando adjudicas una propuesta, o cuando contactas a alguien desde su ficha."
        />
      )}
    </div>
  );
}

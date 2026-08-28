import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BotonEnlace, Encabezado, Insignia, Tarjeta, Vacio } from "@/components/ui";
import { actividadDe } from "@/lib/casos/actividad";
import { oportunidadesDe } from "@/lib/casos/necesidades";
import { fecha, monto } from "@/lib/formato";
import { puedeOfrecer, requerirPerfil } from "@/lib/sesion";

import { FormularioCalificacion } from "../necesidades/[id]/acciones-cliente";

export const metadata: Metadata = { title: "Actividad" };
export const dynamic = "force-dynamic";

const VISTAS = [
  { valor: "necesidades", etiqueta: "Mis necesidades" },
  { valor: "oportunidades", etiqueta: "Oportunidades" },
  { valor: "propuestas", etiqueta: "Mis propuestas" },
  { valor: "operaciones", etiqueta: "Operaciones" },
] as const;

export default async function PaginaActividad({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const { vista = "necesidades" } = await searchParams;
  const perfil = await requerirPerfil("/actividad");
  const ofrece = puedeOfrecer(perfil);

  const [actividad, oportunidades] = await Promise.all([
    actividadDe(perfil.id),
    ofrece ? oportunidadesDe(perfil.id, 30) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Actividad"
        bajada="Todo lo que tienes abierto, en curso y cerrado, con su traza."
        acciones={
          <BotonEnlace href="/publicar" tamano="sm">
            Publicar
          </BotonEnlace>
        }
      />

      <nav className="flex flex-wrap gap-2">
        {VISTAS.filter((v) => ofrece || (v.valor !== "oportunidades" && v.valor !== "propuestas")).map(
          (v) => (
            <Link
              key={v.valor}
              href={`/actividad?vista=${v.valor}`}
              className={
                vista === v.valor
                  ? "rounded-full bg-marca px-3.5 py-1.5 text-xs font-medium text-white"
                  : "rounded-full border border-borde bg-superficie px-3.5 py-1.5 text-xs text-tenue transition hover:bg-superficie2"
              }
            >
              {v.etiqueta}
            </Link>
          ),
        )}
      </nav>

      {vista === "necesidades" ? (
        actividad.misNecesidades.length ? (
          <Tarjeta className="divide-y divide-borde">
            {actividad.misNecesidades.map(({ necesidad, propuestas, comunaNombre }) => (
              <Link
                key={necesidad.id}
                href={`/necesidades/${necesidad.id}`}
                className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-superficie2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm text-texto">{necesidad.titulo}</p>
                    <Insignia
                      tono={
                        necesidad.estado === "completada"
                          ? "exito"
                          : necesidad.estado === "cancelada"
                            ? "neutro"
                            : "marca"
                      }
                    >
                      {necesidad.estado.replace("_", " ")}
                    </Insignia>
                  </div>
                  <p className="mt-0.5 text-xs text-tenue">
                    {fecha(necesidad.creadoEn)} · {comunaNombre ?? "sin comuna"} · {propuestas}{" "}
                    propuesta(s)
                  </p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-tenue" />
              </Link>
            ))}
          </Tarjeta>
        ) : (
          <Vacio
            titulo="No has publicado necesidades"
            descripcion="Publica lo que necesitas y recibe propuestas comparables."
          >
            <BotonEnlace href="/publicar" tamano="sm">
              Publicar una necesidad
            </BotonEnlace>
          </Vacio>
        )
      ) : null}

      {vista === "oportunidades" ? (
        oportunidades.length ? (
          <Tarjeta className="divide-y divide-borde">
            {oportunidades.map(({ invitacion, necesidad, comunaNombre, yaPropuso }) => (
              <Link
                key={invitacion.id}
                href={`/necesidades/${necesidad.id}`}
                className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-superficie2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm text-texto">{necesidad.titulo}</p>
                    {invitacion.origen === "ia" ? (
                      <Insignia tono="marca">Match automático</Insignia>
                    ) : (
                      <Insignia tono="contorno">Invitación directa</Insignia>
                    )}
                    {yaPropuso ? <Insignia tono="exito">Ya cotizaste</Insignia> : null}
                  </div>
                  <p className="mt-0.5 text-xs text-tenue">
                    {comunaNombre ?? "sin comuna"}
                    {invitacion.distanciaKm
                      ? ` · a ${Number(invitacion.distanciaKm).toFixed(1).replace(".", ",")} km`
                      : ""}
                    {invitacion.motivo ? ` · ${invitacion.motivo}` : ""}
                  </p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-tenue" />
              </Link>
            ))}
          </Tarjeta>
        ) : (
          <Vacio
            titulo="Sin oportunidades por ahora"
            descripcion="Las necesidades que calcen con tus categorías y tu zona aparecerán aquí en cuanto se publiquen."
          />
        )
      ) : null}

      {vista === "propuestas" ? (
        actividad.misPropuestas.length ? (
          <Tarjeta className="divide-y divide-borde">
            {actividad.misPropuestas.map(({ propuesta, necesidad, solicitanteNombre }) => (
              <Link
                key={propuesta.id}
                href={`/necesidades/${necesidad.id}`}
                className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-superficie2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm text-texto">{necesidad.titulo}</p>
                    <Insignia
                      tono={
                        propuesta.estado === "adjudicada"
                          ? "exito"
                          : propuesta.estado === "descartada"
                            ? "neutro"
                            : "marca"
                      }
                    >
                      {propuesta.estado}
                    </Insignia>
                  </div>
                  <p className="mt-0.5 text-xs text-tenue">
                    {solicitanteNombre} · {monto(propuesta.monto, propuesta.moneda)} ·{" "}
                    {propuesta.plazoDias} día(s)
                  </p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-tenue" />
              </Link>
            ))}
          </Tarjeta>
        ) : (
          <Vacio
            titulo="No has enviado propuestas"
            descripcion="Cuando recibas una oportunidad, podrás responder con monto y plazo."
          />
        )
      ) : null}

      {vista === "operaciones" ? (
        actividad.misOperaciones.length ? (
          <div className="grid gap-3">
            {actividad.misOperaciones.map((o) => (
              <Tarjeta key={o.operacion.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-texto">{o.necesidadTitulo}</p>
                    <p className="mt-0.5 text-xs text-tenue">
                      {o.soyComprador ? "Contrataste a" : "Trabajo para"} {o.contraparteNombre} ·{" "}
                      {monto(o.operacion.monto, o.operacion.moneda)} · {fecha(o.operacion.acordadaEn)}
                    </p>
                  </div>
                  <Insignia tono={o.operacion.estado === "cerrada" ? "exito" : "marca"}>
                    {o.operacion.estado}
                  </Insignia>
                </div>

                {o.operacion.estado !== "acordada" && !o.yaCalifique ? (
                  <div className="mt-4 border-t border-borde pt-4">
                    <FormularioCalificacion
                      operacionId={o.operacion.id}
                      contraparte={o.contraparteNombre}
                    />
                  </div>
                ) : null}
              </Tarjeta>
            ))}
          </div>
        ) : (
          <Vacio
            titulo="Sin operaciones todavía"
            descripcion="Una operación nace cuando adjudicas una propuesta o cuando te adjudican la tuya."
          />
        )
      ) : null}
    </div>
  );
}

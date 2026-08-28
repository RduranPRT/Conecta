import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { BadgeCheck, MapPin, Sparkles } from "lucide-react";

import { Avatar, BotonEnlace, Encabezado, Estrellas, Insignia, Tarjeta, Vacio } from "@/components/ui";
import { TarjetaActor } from "@/components/tarjeta-actor";
import { db } from "@/db";
import { invitaciones, operaciones, propuestas as tablaPropuestas } from "@/db/schema";
import { trazaDeNecesidad } from "@/lib/casos/actividad";
import { calcularMatch, obtenerNecesidad } from "@/lib/casos/necesidades";
import { propuestasDe } from "@/lib/casos/propuestas";
import { fechaHora, haceCuanto, monto } from "@/lib/formato";
import { formatearDistancia } from "@/lib/geo";
import { obtenerPerfil } from "@/lib/sesion";

import {
  BotonAdjudicar,
  BotonEntrega,
  BotonInvitar,
  FormularioCalificacion,
  FormularioPropuesta,
} from "./acciones-cliente";

export const metadata: Metadata = { title: "Necesidad" };
export const dynamic = "force-dynamic";

const ESTADO_TONO: Record<string, "marca" | "alerta" | "exito" | "neutro"> = {
  publicada: "alerta",
  en_cotizacion: "marca",
  adjudicada: "marca",
  en_ejecucion: "marca",
  completada: "exito",
  cancelada: "neutro",
};

const ETIQUETA_EVENTO: Record<string, string> = {
  "necesidad.publicada": "Necesidad publicada",
  "necesidad.oportunidades_generadas": "La plataforma buscó actores compatibles",
  "necesidad.invitacion_manual": "Invitación directa a cotizar",
  "propuesta.enviada": "Propuesta recibida",
  "propuesta.retirada": "Propuesta retirada",
  "necesidad.adjudicada": "Adjudicada",
  "operacion.entregada": "Entrega confirmada",
  "operacion.calificada": "Calificación registrada",
};

export default async function PaginaNecesidad({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const necesidadId = Number(id);
  if (Number.isNaN(necesidadId)) notFound();

  const fila = await obtenerNecesidad(necesidadId);
  if (!fila) notFound();

  const { necesidad, solicitante, comunaNombre, categoriaNombre } = fila;
  const perfil = await obtenerPerfil();
  const soySolicitante = perfil?.id === necesidad.solicitantePerfilId;

  const [propuestas, traza, operacion] = await Promise.all([
    propuestasDe(necesidadId),
    trazaDeNecesidad(necesidadId),
    db.query.operaciones.findFirst({ where: eq(operaciones.necesidadId, necesidadId) }),
  ]);

  const miPropuesta = perfil
    ? await db.query.propuestas.findFirst({
        where: and(
          eq(tablaPropuestas.necesidadId, necesidadId),
          eq(tablaPropuestas.perfilId, perfil.id),
        ),
      })
    : null;

  const miInvitacion = perfil
    ? await db.query.invitaciones.findFirst({
        where: and(
          eq(invitaciones.necesidadId, necesidadId),
          eq(invitaciones.perfilId, perfil.id),
        ),
      })
    : null;

  const candidatos = soySolicitante ? await calcularMatch(necesidad, 6) : [];
  const invitados = soySolicitante
    ? new Set(
        (
          await db
            .select({ perfilId: invitaciones.perfilId })
            .from(invitaciones)
            .where(eq(invitaciones.necesidadId, necesidadId))
        ).map((i) => i.perfilId),
      )
    : new Set<number>();

  const abierta = necesidad.estado === "publicada" || necesidad.estado === "en_cotizacion";
  const puedeCotizar = Boolean(perfil) && !soySolicitante && abierta;

  const mejor = propuestas.length
    ? propuestas.reduce((a, b) => (Number(a.propuesta.monto) <= Number(b.propuesta.monto) ? a : b))
    : null;

  return (
    <div className="space-y-8">
      <Encabezado
        titulo={necesidad.titulo}
        bajada={
          <span className="flex flex-wrap items-center gap-2">
            <Insignia tono={ESTADO_TONO[necesidad.estado] ?? "neutro"}>
              {necesidad.estado.replace("_", " ")}
            </Insignia>
            <span className="inline-flex items-center gap-1 text-xs">
              <MapPin size={12} />
              {comunaNombre ?? "sin comuna"}
            </span>
            {categoriaNombre ? <span className="text-xs">· {categoriaNombre}</span> : null}
            <span className="text-xs">· publicada {haceCuanto(necesidad.creadoEn)}</span>
            {necesidad.urgencia === "hoy" ? <Insignia tono="alerta">Para hoy</Insignia> : null}
          </span>
        }
      />

      <Tarjeta className="p-5">
        <div className="flex items-start gap-3">
          <Avatar nombre={solicitante.nombre} url={solicitante.avatarUrl} tamano={44} />
          <div className="min-w-0 flex-1">
            <Link
              href={`/p/${solicitante.slug}`}
              className="text-sm font-semibold text-texto hover:text-marca"
            >
              {solicitante.nombre}
            </Link>
            <div className="mt-0.5">
              <Estrellas
                valor={solicitante.reputacionPromedio}
                conteo={solicitante.reputacionConteo}
              />
            </div>
          </div>
          {necesidad.presupuestoMax ? (
            <div className="text-right">
              <p className="text-xs text-tenue">Presupuesto</p>
              <p className="text-sm font-semibold text-texto">
                {necesidad.presupuestoMin
                  ? `${monto(necesidad.presupuestoMin, necesidad.moneda)} – `
                  : "hasta "}
                {monto(necesidad.presupuestoMax, necesidad.moneda)}
              </p>
            </div>
          ) : null}
        </div>

        <p className="mt-4 whitespace-pre-line text-sm text-texto">{necesidad.descripcion}</p>

        {necesidad.interpretacion ? (
          <p className="mt-4 flex items-center gap-1.5 border-t border-borde pt-3 text-xs text-tenue">
            <Sparkles size={12} className="text-marca" />
            Interpretación al publicar:{" "}
            {(necesidad.interpretacion as { explicacion?: string }).explicacion ??
              "sin señales adicionales"}
          </p>
        ) : null}
      </Tarjeta>

      {puedeCotizar ? (
        <section>
          <h2 className="titulo-seccion mb-3">
            {miPropuesta ? "Tu propuesta" : "Enviar una propuesta"}
          </h2>
          {miInvitacion ? (
            <p className="mb-3 text-xs text-marca">
              {miInvitacion.origen === "ia"
                ? `Te llegó como oportunidad automática${
                    miInvitacion.distanciaKm
                      ? ` · a ${formatearDistancia(Number(miInvitacion.distanciaKm))}`
                      : ""
                  }`
                : "Te invitaron directamente a cotizar"}
            </p>
          ) : null}
          <Tarjeta className="p-5">
            <FormularioPropuesta
              necesidadId={necesidadId}
              moneda={necesidad.moneda}
              propuestaPrevia={
                miPropuesta
                  ? {
                      monto: miPropuesta.monto,
                      plazoDias: miPropuesta.plazoDias,
                      mensaje: miPropuesta.mensaje,
                    }
                  : null
              }
            />
          </Tarjeta>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="titulo-seccion">
            Propuestas recibidas ({propuestas.length})
          </h2>
          {mejor && propuestas.length > 1 ? (
            <span className="text-xs text-tenue">
              Menor monto: {monto(mejor.propuesta.monto, mejor.propuesta.moneda)}
            </span>
          ) : null}
        </div>

        {propuestas.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-xs text-tenue">
                  <th className="border-b border-borde px-3 py-2 font-medium">Quién</th>
                  <th className="border-b border-borde px-3 py-2 font-medium">Monto</th>
                  <th className="border-b border-borde px-3 py-2 font-medium">Plazo</th>
                  <th className="border-b border-borde px-3 py-2 font-medium">Reputación</th>
                  <th className="border-b border-borde px-3 py-2 font-medium">Experiencia</th>
                  <th className="border-b border-borde px-3 py-2 font-medium">Propuesta</th>
                  {soySolicitante && abierta ? (
                    <th className="border-b border-borde px-3 py-2" />
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {propuestas.map(({ propuesta, perfil: p, operacionesPrevias }) => (
                  <tr
                    key={propuesta.id}
                    className={
                      propuesta.estado === "adjudicada"
                        ? "bg-exito/5"
                        : propuesta.estado === "descartada"
                          ? "opacity-60"
                          : ""
                    }
                  >
                    <td className="border-b border-borde px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar nombre={p.nombre} url={p.avatarUrl} tamano={28} />
                        <div className="min-w-0">
                          <Link
                            href={`/p/${p.slug}`}
                            className="block truncate font-medium text-texto hover:text-marca"
                          >
                            {p.nombre}
                          </Link>
                          <span className="text-xs text-tenue">{p.comunaId ? "" : ""}</span>
                        </div>
                        {propuesta.estado === "adjudicada" ? (
                          <BadgeCheck size={15} className="text-exito" />
                        ) : null}
                      </div>
                    </td>
                    <td className="border-b border-borde px-3 py-3 font-semibold text-texto">
                      {monto(propuesta.monto, propuesta.moneda)}
                    </td>
                    <td className="border-b border-borde px-3 py-3 text-tenue">
                      {propuesta.plazoDias} {propuesta.plazoDias === 1 ? "día" : "días"}
                    </td>
                    <td className="border-b border-borde px-3 py-3">
                      <Estrellas valor={p.reputacionPromedio} conteo={p.reputacionConteo} />
                    </td>
                    <td className="border-b border-borde px-3 py-3 text-tenue">
                      {operacionesPrevias} {operacionesPrevias === 1 ? "trabajo" : "trabajos"}
                    </td>
                    <td className="max-w-xs border-b border-borde px-3 py-3 text-tenue">
                      {propuesta.mensaje ?? "—"}
                    </td>
                    {soySolicitante && abierta ? (
                      <td className="border-b border-borde px-3 py-3 text-right">
                        <BotonAdjudicar necesidadId={necesidadId} propuestaId={propuesta.id} />
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Vacio
            titulo="Todavía no hay propuestas"
            descripcion={
              soySolicitante
                ? "La plataforma ya avisó a los actores compatibles. También puedes invitar a alguien directamente desde la lista de abajo."
                : "Sé el primero en cotizar."
            }
          />
        )}
      </section>

      {operacion ? (
        <section>
          <h2 className="titulo-seccion mb-3">Operación</h2>
          <Tarjeta className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-texto">
                  Adjudicada por {monto(operacion.monto, operacion.moneda)} ·{" "}
                  <Insignia tono={operacion.estado === "cerrada" ? "exito" : "marca"}>
                    {operacion.estado}
                  </Insignia>
                </p>
                <p className="mt-1 text-xs text-tenue">
                  Acordada el {fechaHora(operacion.acordadaEn)}
                  {operacion.completadaEn
                    ? ` · entrega confirmada el ${fechaHora(operacion.completadaEn)}`
                    : ""}
                </p>
                <p className="mt-1 text-xs text-tenue">
                  El pago se coordina fuera de la plataforma en esta versión.
                </p>
              </div>

              {perfil &&
              (perfil.id === operacion.compradorPerfilId ||
                perfil.id === operacion.proveedorPerfilId) ? (
                <div className="flex items-center gap-2">
                  {operacion.estado === "acordada" ? (
                    <BotonEntrega operacionId={operacion.id} />
                  ) : null}
                  <BotonEnlace href="/mensajes" variante="secundario" tamano="sm">
                    Ir a la conversación
                  </BotonEnlace>
                </div>
              ) : null}
            </div>

            {perfil &&
            operacion.estado !== "acordada" &&
            (perfil.id === operacion.compradorPerfilId ||
              perfil.id === operacion.proveedorPerfilId) ? (
              <div className="mt-5 border-t border-borde pt-5">
                <FormularioCalificacion
                  operacionId={operacion.id}
                  contraparte={
                    perfil.id === operacion.compradorPerfilId ? "el proveedor" : "el cliente"
                  }
                />
              </div>
            ) : null}
          </Tarjeta>
        </section>
      ) : null}

      {soySolicitante && abierta ? (
        <section>
          <h2 className="titulo-seccion mb-1">Actores compatibles</h2>
          <p className="mb-3 text-xs text-tenue">
            Ordenados por distancia, relevancia, disponibilidad y reputación. Los primeros ya
            recibieron la oportunidad automáticamente.
          </p>
          <div className="grid gap-3">
            {candidatos.map((actor) => (
              <TarjetaActor
                key={actor.id}
                actor={actor}
                accion={
                  <BotonInvitar
                    necesidadId={necesidadId}
                    perfilId={actor.id}
                    yaInvitado={invitados.has(actor.id)}
                  />
                }
              />
            ))}
            {!candidatos.length ? (
              <Tarjeta className="px-4 py-6 text-center text-sm text-tenue">
                Todavía no hay actores registrados que calcen con esta necesidad.
              </Tarjeta>
            ) : null}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="titulo-seccion mb-3">Traza</h2>
        <Tarjeta className="divide-y divide-borde">
          {traza.map(({ evento, actorNombre }) => (
            <div key={evento.id} className="flex items-baseline gap-3 px-4 py-2.5 text-sm">
              <span className="w-36 shrink-0 text-xs text-tenue">
                {fechaHora(evento.creadoEn)}
              </span>
              <span className="text-texto">
                {ETIQUETA_EVENTO[evento.tipo] ?? evento.tipo}
                {actorNombre ? <span className="text-tenue"> · {actorNombre}</span> : null}
              </span>
            </div>
          ))}
        </Tarjeta>
      </section>
    </div>
  );
}

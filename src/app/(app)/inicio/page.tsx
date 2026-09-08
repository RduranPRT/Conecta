import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Bot, Handshake, PackageSearch, Sparkles, Store, Wrench } from "lucide-react";

import { BuscadorRapido } from "@/components/buscador-rapido";
import { TarjetaActor } from "@/components/tarjeta-actor";
import { BotonEnlace, Encabezado, Insignia, Tarjeta, Vacio } from "@/components/ui";
import { actividadDe, pulsoTerritorial } from "@/lib/casos/actividad";
import { buscarActores } from "@/lib/casos/actores";
import { listarNecesidades, oportunidadesDe } from "@/lib/casos/necesidades";
import { monto } from "@/lib/formato";
import { intencionVacia } from "@/lib/ia/tipos";
import { puedeOfrecer, requerirPerfil } from "@/lib/sesion";

export const metadata: Metadata = { title: "Inicio" };
export const dynamic = "force-dynamic";

const ESTADO_TONO: Record<string, "marca" | "alerta" | "exito" | "neutro"> = {
  publicada: "alerta",
  en_cotizacion: "marca",
  adjudicada: "marca",
  en_ejecucion: "marca",
  completada: "exito",
  cancelada: "neutro",
};

export default async function PaginaInicio() {
  const perfil = await requerirPerfil("/inicio");
  const ofrece = puedeOfrecer(perfil);

  const [actividad, pulso, oportunidades, abiertas, destacados] = await Promise.all([
    actividadDe(perfil.id),
    pulsoTerritorial(perfil.comunaId),
    ofrece ? oportunidadesDe(perfil.id, 4) : Promise.resolve([]),
    listarNecesidades({
      comunaId: perfil.comunaId,
      estado: ["publicada", "en_cotizacion"],
      limite: 5,
    }),
    buscarActores(
      { ...intencionVacia(""), comunaId: perfil.comunaId },
      {
        desde: perfil.lat && perfil.lng ? { lat: perfil.lat, lng: perfil.lng } : null,
        limite: 3,
        roles: ["prestador", "negocio", "proveedor", "productor"],
      },
    ),
  ]);

  const misAbiertas = actividad.misNecesidades.filter(
    (n) => n.necesidad.estado === "publicada" || n.necesidad.estado === "en_cotizacion",
  );

  return (
    <div className="space-y-8">
      <section className="tarjeta overflow-hidden">
        <div className="bg-marca/10 px-5 py-6 sm:px-7">
          <p className="text-xs font-medium uppercase tracking-wider text-marca">
            {perfil.comunaNombre ?? "Tu territorio"}
            {perfil.regionNombre ? ` · ${perfil.regionNombre}` : ""}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-texto">
            Hola, {perfil.nombre.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-tenue">
            {ofrece
              ? "Revisa tus oportunidades, responde cotizaciones y mantén tu disponibilidad al día."
              : "Busca lo que necesitas o publícalo: la plataforma avisa a quien puede resolverlo."}
          </p>
          <div className="mt-4 max-w-xl">
            <Suspense fallback={<div className="h-14" />}>
              <BuscadorRapido tamano="lg" />
            </Suspense>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <BotonEnlace href="/publicar?tipo=necesidad" tamano="md">
              Necesito algo
            </BotonEnlace>
            <BotonEnlace href="/publicar?tipo=oferta" variante="secundario" tamano="md">
              Ofrezco algo
            </BotonEnlace>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { href: "/descubrir?tipo=producto", etiqueta: "Productos", icono: PackageSearch },
              { href: "/descubrir?tipo=servicio", etiqueta: "Servicios", icono: Wrench },
              { href: "/mapa?rol=negocio", etiqueta: "Negocios", icono: Store },
              { href: "/mapa?rol=prestador", etiqueta: "Prestadores", icono: Handshake },
            ].map(({ href, etiqueta, icono: Icono }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1.5 rounded-full border border-borde bg-superficie px-3 py-1.5 text-xs text-tenue transition hover:bg-superficie2"
              >
                <Icono size={13} />
                {etiqueta}
              </Link>
            ))}
          </div>

          <Link
            href="/descubrir"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-marca hover:underline"
          >
            Explorar el feed completo <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-2 divide-x divide-borde border-t border-borde sm:grid-cols-4">
          {[
            { valor: pulso.actores, etiqueta: "actores en tu comuna" },
            { valor: pulso.necesidadesAbiertas, etiqueta: "necesidades abiertas" },
            {
              valor: ofrece ? actividad.oportunidadesAbiertas : misAbiertas.length,
              etiqueta: ofrece ? "oportunidades para ti" : "necesidades tuyas abiertas",
            },
            { valor: pulso.operacionesCerradas, etiqueta: "operaciones concretadas" },
          ].map((m) => (
            <div key={m.etiqueta} className="px-4 py-4 text-center">
              <p className="text-xl font-semibold text-texto">{m.valor}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-tenue">{m.etiqueta}</p>
            </div>
          ))}
        </div>
      </section>

      {ofrece ? (
        <section>
          <Encabezado
            titulo="Oportunidades para ti"
            bajada="Necesidades publicadas que calzan con tus categorías y tu zona."
            acciones={
              <BotonEnlace href="/actividad?vista=oportunidades" variante="secundario" tamano="sm">
                Ver todas
              </BotonEnlace>
            }
          />
          {oportunidades.length ? (
            <div className="grid gap-3">
              {oportunidades.map(({ invitacion, necesidad, comunaNombre, yaPropuso }) => (
                <Link
                  key={invitacion.id}
                  href={`/necesidades/${necesidad.id}`}
                  className="tarjeta flex items-center gap-4 p-4 transition hover:shadow-flotante"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-texto">{necesidad.titulo}</p>
                      {invitacion.origen === "ia" ? (
                        <Insignia tono="marca">
                          <Sparkles size={11} /> Match automático
                        </Insignia>
                      ) : (
                        <Insignia tono="contorno">Invitación directa</Insignia>
                      )}
                      {yaPropuso ? <Insignia tono="exito">Ya cotizaste</Insignia> : null}
                    </div>
                    <p className="mt-1 text-xs text-tenue">
                      {comunaNombre ?? "Sin comuna"}
                      {invitacion.distanciaKm
                        ? ` · a ${Number(invitacion.distanciaKm).toFixed(1).replace(".", ",")} km`
                        : ""}
                      {invitacion.motivo ? ` · ${invitacion.motivo}` : ""}
                    </p>
                  </div>
                  <ArrowRight size={16} className="shrink-0 text-tenue" />
                </Link>
              ))}
            </div>
          ) : (
            <Vacio
              titulo="Todavía no hay oportunidades"
              descripcion="Cuando alguien publique una necesidad que calce con tus categorías y tu zona, aparecerá aquí automáticamente."
            >
              <BotonEnlace href="/mi-perfil" variante="secundario" tamano="sm">
                Revisar mis categorías
              </BotonEnlace>
            </Vacio>
          )}
        </section>
      ) : null}

      <section>
        <Encabezado
          titulo="Tus necesidades"
          acciones={
            <BotonEnlace href="/publicar" tamano="sm">
              Publicar una necesidad
            </BotonEnlace>
          }
        />
        {misAbiertas.length ? (
          <div className="grid gap-3">
            {misAbiertas.slice(0, 4).map(({ necesidad, propuestas, comunaNombre }) => (
              <Link
                key={necesidad.id}
                href={`/necesidades/${necesidad.id}`}
                className="tarjeta flex items-center gap-4 p-4 transition hover:shadow-flotante"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-texto">{necesidad.titulo}</p>
                    <Insignia tono={ESTADO_TONO[necesidad.estado] ?? "neutro"}>
                      {necesidad.estado.replace("_", " ")}
                    </Insignia>
                  </div>
                  <p className="mt-1 text-xs text-tenue">
                    {propuestas} {propuestas === 1 ? "propuesta recibida" : "propuestas recibidas"}
                    {comunaNombre ? ` · ${comunaNombre}` : ""}
                    {necesidad.presupuestoMax
                      ? ` · hasta ${monto(necesidad.presupuestoMax, necesidad.moneda)}`
                      : ""}
                  </p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-tenue" />
              </Link>
            ))}
          </div>
        ) : (
          <Vacio
            titulo="No tienes necesidades abiertas"
            descripcion="Publica lo que necesitas y la plataforma buscará automáticamente quién puede resolverlo, cerca de ti."
          >
            <BotonEnlace href="/publicar" tamano="sm">
              Publicar ahora
            </BotonEnlace>
          </Vacio>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="titulo-seccion mb-3">Abiertas en tu comuna</h2>
          {abiertas.length ? (
            <Tarjeta className="divide-y divide-borde">
              {abiertas.map(({ necesidad, comunaNombre, propuestas }) => (
                <Link
                  key={necesidad.id}
                  href={`/necesidades/${necesidad.id}`}
                  className="block px-4 py-3 transition hover:bg-superficie2"
                >
                  <p className="truncate text-sm text-texto">{necesidad.titulo}</p>
                  <p className="mt-0.5 text-xs text-tenue">
                    {comunaNombre ?? "—"} · {propuestas} propuesta(s)
                  </p>
                </Link>
              ))}
            </Tarjeta>
          ) : (
            <Tarjeta className="px-4 py-6 text-center text-sm text-tenue">
              Nadie ha publicado una necesidad todavía.
            </Tarjeta>
          )}
        </section>

        <section>
          <h2 className="titulo-seccion mb-3">Cerca de ti</h2>
          <div className="grid gap-3">
            {destacados.length ? (
              destacados.map((actor) => <TarjetaActor key={actor.id} actor={actor} />)
            ) : (
              <Tarjeta className="px-4 py-6 text-center text-sm text-tenue">
                Aún no hay actores registrados en tu comuna.
              </Tarjeta>
            )}
          </div>
        </section>
      </div>

      {pulso.categoriasCalientes.length ? (
        <section className="tarjeta p-5">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-marca" />
            <h2 className="text-sm font-semibold text-texto">Lectura del territorio</h2>
          </div>
          <p className="mt-2 text-sm text-tenue">
            En los últimos 30 días, lo más pedido en {perfil.comunaNombre ?? "tu zona"} fue{" "}
            {pulso.categoriasCalientes
              .map((c) => `${c.nombre.toLowerCase()} (${c.total})`)
              .join(", ")}
            . {pulso.necesidadesAbiertas > 0
              ? `Quedan ${pulso.necesidadesAbiertas} necesidades sin adjudicar.`
              : "No quedan necesidades sin adjudicar."}
          </p>
          <p className="mt-2 text-xs text-tenue">
            En la Fase 2 esta lectura la produce el Agente Analítica. Hoy sale de una consulta
            directa a la base, sin modelo de por medio.
          </p>
        </section>
      ) : null}
    </div>
  );
}

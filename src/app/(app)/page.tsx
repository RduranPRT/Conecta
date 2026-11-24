import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  ChevronRight,
  Handshake,
  PackageSearch,
  Plus,
  Sparkles,
  Store,
  Wrench,
} from "lucide-react";

import { AccionConSesion } from "@/components/accion-con-sesion";
import { BuscadorRapido } from "@/components/buscador-rapido";
import { QueEsConecta } from "@/components/que-es-conecta";
import { TarjetaDestacada } from "@/components/tarjeta-destacada";
import { IndicadorTerritorio } from "@/components/territorio-explorado";
import { BotonEnlace, Encabezado, Insignia, Vacio } from "@/components/ui";
import { actividadDe } from "@/lib/casos/actividad";
import { arbolDeRubros } from "@/lib/casos/categorias";
import { feedPara } from "@/lib/casos/feed";
import { oportunidadesDe } from "@/lib/casos/necesidades";
import { opcionesTerritorio } from "@/lib/casos/territorio";
import { monto } from "@/lib/formato";
import { obtenerPerfil, puedeOfrecer } from "@/lib/sesion";
import { territorioDeLaPeticion } from "@/lib/territorio-sesion";

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

/** Accesos por tipo, como mosaicos (UX simplificada de Álvaro, sep-2026). */
const ACCESOS = [
  { href: "/descubrir?tipo=producto", etiqueta: "Productos", icono: PackageSearch },
  { href: "/descubrir?tipo=servicio", etiqueta: "Servicios", icono: Wrench },
  { href: "/mapa?rol=negocio", etiqueta: "Comercios", icono: Store },
  { href: "/mapa?rol=prestador", etiqueta: "Prestadores", icono: Handshake },
];

/**
 * Inicio, con y sin sesión (N03): buscador, accesos por tipo, «Necesito algo»
 * / «Ofrezco algo» y publicaciones destacadas. El visitante ve además qué es
 * Conecta; quien tiene cuenta ve, debajo, su trabajo pendiente. El resto de su
 * actividad vive en Mi Conecta.
 */
export default async function PaginaInicio() {
  const perfil = await obtenerPerfil();
  const haySesion = Boolean(perfil);
  const ofrece = puedeOfrecer(perfil);

  const explorado = await territorioDeLaPeticion();
  // La comuna piloto solo ordena; la propia o la elegida, además filtra.
  const soloMiZona = Boolean(explorado.comuna && (explorado.explicito || perfil?.comunaId));

  const [actividad, oportunidades, feed, rubros, territorio] = await Promise.all([
    perfil ? actividadDe(perfil.id) : null,
    perfil && ofrece ? oportunidadesDe(perfil.id, 4) : [],
    feedPara({
      perfilId: perfil?.id ?? null,
      comunaId: explorado.comuna?.id ?? null,
      soloMiZona,
      limite: 12,
    }),
    arbolDeRubros(),
    opcionesTerritorio(),
  ]);

  // Las necesidades abiertas llegan a quien puede resolverlas por
  // «Oportunidades para ti»; aquí se destacan productos, servicios y ofertas.
  const destacadas = feed.filter((p) => p.publicacion.tipo !== "necesidad").slice(0, 3);

  const misAbiertas = (actividad?.misNecesidades ?? []).filter(
    (n) => n.necesidad.estado === "publicada" || n.necesidad.estado === "en_cotizacion",
  );

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-texto">¿Qué necesitas?</h1>
            <p className="mt-0.5 text-sm text-tenue">
              {perfil
                ? `Hola, ${perfil.nombre.split(" ")[0]}. Busca, pide u ofrece cerca de ti.`
                : "Productos, servicios, negocios y prestadores cerca de ti."}
            </p>
          </div>
        </div>
        <IndicadorTerritorio explorado={explorado} territorio={territorio} volver="/" />

        <Suspense fallback={<div className="h-14" />}>
          <BuscadorRapido tamano="lg" />
        </Suspense>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <AccionConSesion
            sinEstilo
            href="/publicar?tipo=necesidad"
            haySesion={haySesion}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-marca/40 bg-marca/10 text-sm font-medium text-marca transition hover:bg-marca/15"
          >
            <Plus size={18} />
            Necesito algo
          </AccionConSesion>
          <AccionConSesion
            sinEstilo
            href="/publicar?tipo=oferta"
            haySesion={haySesion}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-marca text-sm font-medium text-white transition hover:bg-marca-fuerte"
          >
            <Plus size={18} />
            Ofrezco algo
          </AccionConSesion>
        </div>

        {!perfil ? <QueEsConecta /> : null}

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {ACCESOS.map(({ href, etiqueta, icono: Icono }) => (
            <Link
              key={href}
              href={href}
              className="tarjeta flex flex-col items-center gap-1.5 px-1 py-3 text-center transition hover:shadow-flotante"
            >
              <Icono size={22} className="text-marca" strokeWidth={1.8} />
              <span className="text-[11px] font-medium text-texto sm:text-xs">{etiqueta}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="titulo-seccion">Publicaciones destacadas</h2>
          <Link
            href="/descubrir"
            className="inline-flex items-center gap-0.5 text-xs font-medium text-marca hover:underline"
          >
            Ver todas <ChevronRight size={14} />
          </Link>
        </div>
        {destacadas.length ? (
          <div className="grid grid-cols-1 gap-3">
            {destacadas.map((p) => (
              <TarjetaDestacada
                key={p.publicacion.id}
                publicacion={p.publicacion}
                autorNombre={p.autorNombre}
                comunaNombre={p.comunaNombre}
                categoriaNombre={p.categoriaNombre}
                guardada={Boolean(p.guardada)}
                patrocinado={p.patrocinado}
                haySesion={haySesion}
              />
            ))}
          </div>
        ) : (
          <Vacio
            titulo={
              explorado.comuna
                ? `Todavía no hay oferta publicada en ${explorado.comuna.nombre}`
                : "Todavía no hay publicaciones"
            }
            descripcion="Cambia de comuna arriba, mira lo que hay en el resto de Chile o usa «Ofrezco algo» para ser el primero."
          >
            <BotonEnlace href="/descubrir?zona=todo" variante="secundario" tamano="sm">
              Ver otras comunas
            </BotonEnlace>
          </Vacio>
        )}
      </section>

      {perfil && ofrece ? (
        <section>
          <Encabezado
            nivel={2}
            titulo="Oportunidades para ti"
            bajada="Necesidades publicadas que calzan con lo que ofreces y tu zona."
          />
          {oportunidades.length ? (
            <div className="grid grid-cols-1 gap-3">
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
              descripcion="Cuando alguien publique una necesidad que calce con lo que ofreces y tu zona, aparecerá aquí automáticamente."
            />
          )}
        </section>
      ) : null}

      {misAbiertas.length ? (
        <section>
          <Encabezado nivel={2} titulo="Tus necesidades" />
          <div className="grid grid-cols-1 gap-3">
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
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="titulo-seccion">Explorar por área</h2>
          <Link
            href="/explorar"
            className="inline-flex items-center gap-0.5 text-xs font-medium text-marca hover:underline"
          >
            Ver todo <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {rubros.map((r) => (
            <Link
              key={r.id}
              href={`/explorar/${r.slug}`}
              className="flex items-center gap-2 rounded-xl border border-borde bg-superficie px-3 py-2.5 text-sm text-texto transition hover:bg-superficie2"
            >
              <span aria-hidden>{r.icono}</span>
              <span className="min-w-0 truncate">{r.nombre}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  ChevronRight,
  Handshake,
  MapPin,
  PackageSearch,
  Plus,
  Sparkles,
  Store,
  Wrench,
} from "lucide-react";

import { BuscadorRapido } from "@/components/buscador-rapido";
import { TarjetaDestacada } from "@/components/tarjeta-destacada";
import { Encabezado, Insignia, Vacio } from "@/components/ui";
import { actividadDe } from "@/lib/casos/actividad";
import { feedPara } from "@/lib/casos/feed";
import { oportunidadesDe } from "@/lib/casos/necesidades";
import { monto } from "@/lib/formato";
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

/** Accesos por tipo, como mosaicos (UX simplificada de Álvaro, sep-2026). */
const ACCESOS = [
  { href: "/descubrir?tipo=producto", etiqueta: "Productos", icono: PackageSearch },
  { href: "/descubrir?tipo=servicio", etiqueta: "Servicios", icono: Wrench },
  { href: "/mapa?rol=negocio", etiqueta: "Negocios", icono: Store },
  { href: "/mapa?rol=prestador", etiqueta: "Prestadores", icono: Handshake },
];

/**
 * Inicio: descubre, busca y publica. Sigue la propuesta de simplificación de
 * Álvaro: buscador, accesos por tipo, «Necesito algo» / «Ofrezco algo» y
 * publicaciones destacadas. Lo que es trabajo pendiente del usuario
 * (oportunidades y necesidades abiertas) queda debajo; el resto de su
 * actividad vive en Mi Conecta.
 */
export default async function PaginaInicio() {
  const perfil = await requerirPerfil("/inicio");
  const ofrece = puedeOfrecer(perfil);

  const [actividad, oportunidades, feed] = await Promise.all([
    actividadDe(perfil.id),
    ofrece ? oportunidadesDe(perfil.id, 4) : Promise.resolve([]),
    feedPara({ perfilId: perfil.id, comunaId: perfil.comunaId, soloMiZona: true, limite: 12 }),
  ]);

  // Las necesidades abiertas llegan a quien puede resolverlas por
  // «Oportunidades para ti»; aquí se destacan productos, servicios y ofertas.
  const destacadas = feed.filter((p) => p.publicacion.tipo !== "necesidad").slice(0, 3);

  const misAbiertas = actividad.misNecesidades.filter(
    (n) => n.necesidad.estado === "publicada" || n.necesidad.estado === "en_cotizacion",
  );

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-texto">
              Hola, {perfil.nombre.split(" ")[0]}
            </h1>
            <p className="mt-0.5 text-sm text-tenue">
              Encuentra productos, servicios, negocios y prestadores cerca de ti.
            </p>
          </div>
          <Link
            href="/mi-perfil"
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-borde px-2.5 py-1 text-xs text-tenue transition hover:bg-superficie2"
            title="Cambiar tu comuna desde Mi perfil"
          >
            <MapPin size={13} className="text-marca" />
            {perfil.comunaNombre ?? "Elige tu comuna"}
          </Link>
        </div>

        <Suspense fallback={<div className="h-14" />}>
          <BuscadorRapido tamano="lg" />
        </Suspense>

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

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Link
            href="/publicar?tipo=necesidad"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-marca/40 bg-marca/10 text-sm font-medium text-marca transition hover:bg-marca/15"
          >
            <Plus size={18} />
            Necesito algo
          </Link>
          <Link
            href="/publicar?tipo=oferta"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-marca text-sm font-medium text-white transition hover:bg-marca-fuerte"
          >
            <Plus size={18} />
            Ofrezco algo
          </Link>
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
          <div className="grid gap-3">
            {destacadas.map((p) => (
              <TarjetaDestacada
                key={p.publicacion.id}
                publicacion={p.publicacion}
                autorNombre={p.autorNombre}
                autorSlug={p.autorSlug}
                comunaNombre={p.comunaNombre}
                categoriaNombre={p.categoriaNombre}
                guardada={Boolean(p.guardada)}
                patrocinado={p.patrocinado}
                hayPerfil
              />
            ))}
          </div>
        ) : (
          <Vacio
            titulo="Todavía no hay publicaciones en tu zona"
            descripcion="Usa «Ofrezco algo» para mostrar tus productos o servicios a quienes están cerca."
          />
        )}
      </section>

      {ofrece ? (
        <section>
          <Encabezado
            titulo="Oportunidades para ti"
            bajada="Necesidades publicadas que calzan con tus categorías y tu zona."
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
            />
          )}
        </section>
      ) : null}

      {misAbiertas.length ? (
        <section>
          <Encabezado titulo="Tus necesidades" />
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
        </section>
      ) : null}
    </div>
  );
}

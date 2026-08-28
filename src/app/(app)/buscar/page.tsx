import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { Sparkles } from "lucide-react";

import { BuscadorRapido } from "@/components/buscador-rapido";
import { Mapa, type PuntoMapa } from "@/components/mapa";
import { TarjetaActor } from "@/components/tarjeta-actor";
import { BotonEnlace, Encabezado, Insignia, Tarjeta, Vacio } from "@/components/ui";
import { db } from "@/db";
import { busquedas, comunas, necesidades, perfiles } from "@/db/schema";
import { buscarActores } from "@/lib/casos/actores";
import { formatearDistancia } from "@/lib/geo";
import { contextoInterprete, hayModelo, interpretar } from "@/lib/ia";
import { obtenerPerfil } from "@/lib/sesion";

export const metadata: Metadata = { title: "Buscar" };
export const dynamic = "force-dynamic";

type Params = Promise<{ q?: string; vista?: string; comuna?: string }>;

const VISTAS = [
  { valor: "lista", etiqueta: "Lista" },
  { valor: "mapa", etiqueta: "Mapa" },
  { valor: "mixta", etiqueta: "Mapa + Lista" },
] as const;

export default async function PaginaBuscar({ searchParams }: { searchParams: Params }) {
  const { q = "", vista = "lista", comuna } = await searchParams;
  const perfil = await obtenerPerfil();

  const contexto = await contextoInterprete(perfil?.comunaId ?? null);
  const intencion = await interpretar(q, contexto);
  if (comuna) intencion.comunaId = Number(comuna) || intencion.comunaId;

  const desde =
    perfil?.lat && perfil?.lng ? { lat: perfil.lat, lng: perfil.lng } : null;

  const actores = q || intencion.comunaId ? await buscarActores(intencion, { desde, limite: 30 }) : [];

  // Publicaciones y necesidades salen de la misma base que los actores.
  const patrones = intencion.terminos.slice(0, 3).map((t) => `%${t}%`);
  const necesidadesRelacionadas = q
    ? await db
        .select({
          necesidad: necesidades,
          solicitanteNombre: perfiles.nombre,
          comunaNombre: comunas.nombre,
        })
        .from(necesidades)
        .innerJoin(perfiles, eq(perfiles.id, necesidades.solicitantePerfilId))
        .leftJoin(comunas, eq(comunas.id, necesidades.comunaId))
        .where(
          and(
            or(eq(necesidades.estado, "publicada"), eq(necesidades.estado, "en_cotizacion")),
            patrones.length
              ? or(
                  ...patrones.flatMap((p) => [
                    ilike(necesidades.titulo, p),
                    ilike(necesidades.descripcion, p),
                  ]),
                )
              : intencion.categoriaId
                ? eq(necesidades.categoriaId, intencion.categoriaId)
                : sql`false`,
          ),
        )
        .orderBy(desc(necesidades.creadoEn))
        .limit(6)
    : [];

  if (q) {
    await db.insert(busquedas).values({
      perfilId: perfil?.id ?? null,
      consulta: q,
      motor: intencion.motor,
      resultados: actores.length,
      interpretacion: {
        categoriaId: intencion.categoriaId,
        comunaId: intencion.comunaId,
        disponibilidad: intencion.disponibilidad,
        terminos: intencion.terminos,
        explicacion: intencion.explicacion,
      },
    });
  }

  const centro = await centroDelMapa(intencion.comunaId, desde);
  const puntos: PuntoMapa[] = actores
    .filter((a) => a.lat !== null && a.lng !== null)
    .map((a) => ({
      id: a.id,
      nombre: a.nombre,
      slug: a.slug,
      lat: a.lat!,
      lng: a.lng!,
      rol: a.roles[0] ?? "persona",
      comuna: a.comunaNombre,
      categoria: a.categorias[0]?.nombre ?? null,
      disponible: a.disponibleAhora,
      reputacion: a.reputacionPromedio,
      distancia: a.distanciaKm !== null ? formatearDistancia(a.distanciaKm) : null,
    }));

  const enlaceVista = (v: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (comuna) p.set("comuna", comuna);
    p.set("vista", v);
    return `/buscar?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <Encabezado
        titulo={q ? `Resultados para «${q}»` : "Buscar"}
        bajada="Un solo buscador para personas, prestadores, negocios, proveedores, productores, servicios y productos."
      />

      <div className="lg:hidden">
        <Suspense fallback={<div className="h-14" />}>
          <BuscadorRapido valorInicial={q} tamano="lg" />
        </Suspense>
      </div>

      {q ? (
        <Tarjeta className="flex flex-wrap items-center gap-2 p-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-marca">
            <Sparkles size={13} />
            {intencion.motor === "modelo" ? "Interpretado por el modelo" : "Interpretación automática"}
          </span>
          <span className="text-xs text-tenue">{intencion.explicacion}</span>
          <div className="ml-auto flex flex-wrap gap-1.5">
            {intencion.categoriaNombre ? (
              <Insignia tono="marca">{intencion.categoriaNombre}</Insignia>
            ) : null}
            {intencion.comunaNombre ? (
              <Insignia tono="contorno">{intencion.comunaNombre}</Insignia>
            ) : null}
            {intencion.disponibilidad !== "cualquiera" ? (
              <Insignia tono="alerta">
                {intencion.disponibilidad === "hoy" ? "Hoy" : "Esta semana"}
              </Insignia>
            ) : null}
            {intencion.cerca ? <Insignia tono="contorno">Cerca de ti</Insignia> : null}
          </div>
        </Tarjeta>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <nav className="inline-flex rounded-xl border border-borde bg-superficie p-1">
          {VISTAS.map((v) => (
            <Link
              key={v.valor}
              href={enlaceVista(v.valor)}
              className={
                vista === v.valor
                  ? "rounded-lg bg-marca px-3 py-1.5 text-xs font-medium text-white"
                  : "rounded-lg px-3 py-1.5 text-xs text-tenue transition hover:bg-superficie2"
              }
            >
              {v.etiqueta}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-tenue">
          {actores.length} {actores.length === 1 ? "resultado" : "resultados"}
          {hayModelo() ? "" : " · orden por distancia, relevancia, disponibilidad y reputación"}
        </p>
      </div>

      {vista !== "lista" && puntos.length ? (
        <Mapa puntos={puntos} centro={centro} alto={vista === "mapa" ? "70vh" : "42vh"} />
      ) : null}

      {vista !== "mapa" ? (
        actores.length ? (
          <div className="grid gap-3">
            {actores.map((actor) => (
              <TarjetaActor key={actor.id} actor={actor} />
            ))}
          </div>
        ) : (
          <Vacio
            titulo={q ? "Nadie calza con esa búsqueda todavía" : "Escribe qué necesitas"}
            descripcion={
              q
                ? "Publicarlo como necesidad hace que la plataforma avise automáticamente a quien pueda resolverlo."
                : "Puedes escribir una palabra («gasfíter») o una frase completa («necesito un gasfíter que pueda venir hoy cerca de mí»)."
            }
          >
            {q ? (
              <BotonEnlace href={`/publicar?q=${encodeURIComponent(q)}`} tamano="sm">
                Publicar como necesidad
              </BotonEnlace>
            ) : null}
          </Vacio>
        )
      ) : null}

      {necesidadesRelacionadas.length ? (
        <section>
          <h2 className="titulo-seccion mb-3">Necesidades abiertas relacionadas</h2>
          <Tarjeta className="divide-y divide-borde">
            {necesidadesRelacionadas.map(({ necesidad, solicitanteNombre, comunaNombre }) => (
              <Link
                key={necesidad.id}
                href={`/necesidades/${necesidad.id}`}
                className="block px-4 py-3 transition hover:bg-superficie2"
              >
                <p className="text-sm text-texto">{necesidad.titulo}</p>
                <p className="mt-0.5 text-xs text-tenue">
                  {solicitanteNombre} · {comunaNombre ?? "sin comuna"}
                </p>
              </Link>
            ))}
          </Tarjeta>
        </section>
      ) : null}
    </div>
  );
}

async function centroDelMapa(
  comunaId: number | null,
  desde: { lat: number; lng: number } | null,
) {
  if (desde) return desde;
  if (comunaId) {
    const comuna = await db.query.comunas.findFirst({ where: eq(comunas.id, comunaId) });
    if (comuna) return { lat: comuna.lat, lng: comuna.lng };
  }
  const piloto = await db.query.comunas.findFirst({ where: eq(comunas.activa, true) });
  return piloto ? { lat: piloto.lat, lng: piloto.lng } : { lat: -33.45, lng: -70.66 };
}

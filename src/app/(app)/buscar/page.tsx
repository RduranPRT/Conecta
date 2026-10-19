import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Sparkles, X } from "lucide-react";

import { Mapa, type PuntoMapa } from "@/components/mapa";
import { SelectorComuna } from "@/components/selector-comuna";
import { TarjetaActor } from "@/components/tarjeta-actor";
import { BotonEnlace, Insignia, Tarjeta, Vacio } from "@/components/ui";
import type { RolActor } from "@/db/schema";
import { buscarActores } from "@/lib/casos/actores";
import { registrarBusqueda } from "@/lib/casos/busquedas";
import { categoriasPorId } from "@/lib/casos/perfil";
import { buscarNecesidadesAbiertas } from "@/lib/casos/necesidades";
import { comunaPiloto, opcionesTerritorio, ubicacionDeComuna } from "@/lib/casos/territorio";
import { formatearDistancia } from "@/lib/geo";
import { contextoInterprete, hayModelo, interpretar } from "@/lib/ia";
import { obtenerPerfil } from "@/lib/sesion";

export const metadata: Metadata = { title: "Buscar" };
export const dynamic = "force-dynamic";

type Params = Promise<{
  q?: string;
  vista?: string;
  comuna?: string;
  categoria?: string;
  rol?: string;
}>;

const VISTAS = [
  { valor: "lista", etiqueta: "Lista" },
  { valor: "mapa", etiqueta: "Mapa" },
  { valor: "mixta", etiqueta: "Ambos" },
] as const;

/** Filtros por tipo de actor (P04): servicio, comercio, proveedor, productor. */
const FILTROS_ROL: { valor: RolActor | "todos"; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todo" },
  { valor: "prestador", etiqueta: "Servicios" },
  { valor: "negocio", etiqueta: "Comercios" },
  { valor: "proveedor", etiqueta: "Proveedores" },
  { valor: "productor", etiqueta: "Productores" },
];

export default async function PaginaBuscar({ searchParams }: { searchParams: Params }) {
  const { q = "", vista = "lista", comuna, categoria, rol = "todos" } = await searchParams;
  const perfil = await obtenerPerfil();

  const contexto = await contextoInterprete(perfil?.comunaId ?? null);
  const intencion = await interpretar(q, contexto);
  if (Number(comuna)) intencion.comunaId = Number(comuna);
  if (Number(categoria)) {
    intencion.categoriaId = Number(categoria);
    const [cat] = await categoriasPorId([Number(categoria)]);
    intencion.categoriaNombre = cat?.nombre ?? intencion.categoriaNombre;
  }

  const desde = perfil?.lat && perfil?.lng ? { lat: perfil.lat, lng: perfil.lng } : null;
  const roles = rol !== "todos" ? [rol as RolActor] : undefined;
  const hayCriterio = Boolean(q || intencion.categoriaId || intencion.comunaId || roles);

  const [actores, necesidadesRelacionadas, territorio, ubicacion] = await Promise.all([
    hayCriterio ? buscarActores(intencion, { desde, limite: 30, roles }) : Promise.resolve([]),
    q || intencion.categoriaId ? buscarNecesidadesAbiertas(intencion) : Promise.resolve([]),
    opcionesTerritorio(),
    ubicacionDeComuna(intencion.comunaId),
  ]);

  if (q) {
    await registrarBusqueda({ perfilId: perfil?.id ?? null, intencion, resultados: actores.length });
  }

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
  const centro =
    desde ??
    (ubicacion ? { lat: ubicacion.lat, lng: ubicacion.lng } : null) ??
    (await comunaPiloto()) ?? { lat: -33.45, lng: -70.66 };

  const enlace = (cambios: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base = { q: q || undefined, comuna, categoria, rol, vista, ...cambios };
    for (const [clave, valor] of Object.entries(base)) {
      if (valor && valor !== "todos" && !(clave === "vista" && valor === "lista")) p.set(clave, valor);
    }
    return `/buscar?${p.toString()}`;
  };

  const titulo = q ? `«${q}»` : intencion.categoriaNombre ?? "Buscar";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h1 className="text-lg font-semibold text-texto">{titulo}</h1>
        {hayCriterio ? (
          <p className="text-xs text-tenue">
            {actores.length} {actores.length === 1 ? "resultado" : "resultados"}
          </p>
        ) : null}
      </div>

      {/* Dónde se está buscando (S20) y cómo se entendió la búsqueda, en una sola franja. */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <details className="group relative">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full border border-borde bg-superficie px-2.5 py-1 text-tenue transition hover:bg-superficie2 [&::-webkit-details-marker]:hidden">
            <MapPin size={12} className="text-marca" />
            {ubicacion ? `${ubicacion.nombre}, ${ubicacion.regionNombre}` : "Todo Chile"}
            <span className="text-marca">· cambiar</span>
          </summary>
          <form
            action="/buscar"
            className="tarjeta absolute left-0 top-9 z-[600] grid w-72 gap-2 p-3 shadow-flotante"
          >
            {q ? <input type="hidden" name="q" value={q} /> : null}
            {categoria ? <input type="hidden" name="categoria" value={categoria} /> : null}
            {rol !== "todos" ? <input type="hidden" name="rol" value={rol} /> : null}
            <SelectorComuna
              territorio={territorio}
              nombre="comuna"
              inicial={intencion.comunaId}
              compacto
              idBase="buscar"
              etiquetaVacia="Elige una comuna"
            />
            <button
              type="submit"
              className="h-9 rounded-lg bg-marca px-3 text-xs font-medium text-white transition hover:bg-marca-fuerte"
            >
              Buscar aquí
            </button>
            {intencion.comunaId ? (
              <Link href={enlace({ comuna: undefined })} className="text-center text-xs text-tenue hover:text-texto">
                Buscar en todo Chile
              </Link>
            ) : null}
          </form>
        </details>

        {intencion.categoriaNombre ? (
          <Link
            href={enlace({ categoria: undefined })}
            className="inline-flex items-center gap-1 rounded-full bg-marca/10 px-2.5 py-1 text-marca"
            title={categoria ? "Quitar filtro" : undefined}
          >
            {intencion.categoriaNombre}
            {categoria ? <X size={11} /> : null}
          </Link>
        ) : null}
        {intencion.disponibilidad !== "cualquiera" ? (
          <Insignia tono="alerta">{intencion.disponibilidad === "hoy" ? "Hoy" : "Esta semana"}</Insignia>
        ) : null}
        {intencion.cerca ? <Insignia tono="contorno">Cerca de ti</Insignia> : null}
        {q ? (
          <span className="inline-flex items-center gap-1 text-tenue" title={intencion.explicacion}>
            <Sparkles size={11} className="text-marca" />
            {intencion.motor === "modelo" ? "interpretado por IA" : "interpretado automáticamente"}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <div className="-mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1">
          {FILTROS_ROL.map((f) => (
            <Link
              key={f.valor}
              href={enlace({ rol: f.valor })}
              className={
                rol === f.valor
                  ? "shrink-0 rounded-full bg-marca px-3 py-1.5 text-xs font-medium text-white"
                  : "shrink-0 rounded-full border border-borde bg-superficie px-3 py-1.5 text-xs text-tenue transition hover:bg-superficie2"
              }
            >
              {f.etiqueta}
            </Link>
          ))}
        </div>
        <nav className="hidden shrink-0 rounded-xl border border-borde bg-superficie p-0.5 sm:inline-flex">
          {VISTAS.map((v) => (
            <Link
              key={v.valor}
              href={enlace({ vista: v.valor })}
              className={
                vista === v.valor
                  ? "rounded-lg bg-marca px-2.5 py-1 text-xs font-medium text-white"
                  : "rounded-lg px-2.5 py-1 text-xs text-tenue transition hover:bg-superficie2"
              }
            >
              {v.etiqueta}
            </Link>
          ))}
        </nav>
      </div>

      {vista !== "lista" && puntos.length ? (
        <Mapa puntos={puntos} centro={centro} alto={vista === "mapa" ? "70vh" : "42vh"} />
      ) : null}

      {vista !== "mapa" ? (
        actores.length ? (
          <div className="grid grid-cols-1 gap-3">
            {actores.map((actor) => (
              <TarjetaActor key={actor.id} actor={actor} />
            ))}
          </div>
        ) : (
          <Vacio
            titulo={hayCriterio ? "Nadie calza con esa búsqueda todavía" : "Escribe qué necesitas"}
            descripcion={
              hayCriterio
                ? "Publícalo como necesidad: la plataforma avisa a quien pueda resolverlo. También puedes buscar en todo Chile o explorar por área."
                : "Una palabra («gasfíter») o una frase completa («necesito un gasfíter que pueda venir hoy cerca de mí»)."
            }
          >
            <div className="flex flex-wrap justify-center gap-2">
              {q ? (
                <BotonEnlace href={`/publicar?q=${encodeURIComponent(q)}`} tamano="sm">
                  Publicar como necesidad
                </BotonEnlace>
              ) : null}
              <BotonEnlace href="/explorar" variante="secundario" tamano="sm">
                Explorar por área
              </BotonEnlace>
            </div>
          </Vacio>
        )
      ) : null}

      {hayCriterio && !hayModelo() && actores.length ? (
        <p className="text-center text-[11px] text-tenue">
          Ordenado por distancia, relevancia, disponibilidad y reputación.
        </p>
      ) : null}

      {necesidadesRelacionadas.length ? (
        <section className="pt-2">
          <h2 className="titulo-seccion mb-3">Pedidos abiertos relacionados</h2>
          <Tarjeta className="divide-y divide-borde">
            {necesidadesRelacionadas.map(({ necesidad, solicitanteNombre, comunaNombre }) => (
              <Link
                key={necesidad.id}
                href={`/necesidades/${necesidad.id}`}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-superficie2"
              >
                <Insignia tono="acento">Busca</Insignia>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-texto">{necesidad.titulo}</span>
                  <span className="mt-0.5 block text-xs text-tenue">
                    {solicitanteNombre} · {comunaNombre ?? "sin comuna"}
                  </span>
                </span>
              </Link>
            ))}
          </Tarjeta>
        </section>
      ) : null}
    </div>
  );
}

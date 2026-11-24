import type { Metadata } from "next";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";

import { GeolocalizarMapa } from "@/components/geolocalizar-mapa";
import { Mapa, type PuntoMapa } from "@/components/mapa";
import { SelectorCategoria } from "@/components/selector-categoria";
import { TarjetaActor } from "@/components/tarjeta-actor";
import { IndicadorTerritorio } from "@/components/territorio-explorado";
import { Encabezado, Insignia, Tarjeta } from "@/components/ui";
import { buscarActores } from "@/lib/casos/actores";
import { opcionesCategoria } from "@/lib/casos/categorias";
import { comunaMasCercana } from "@/lib/casos/perfil";
import { opcionesTerritorio, ubicacionDeComuna } from "@/lib/casos/territorio";
import { formatearDistancia } from "@/lib/geo";
import { contextoInterprete, interpretar } from "@/lib/ia";
import { ROLES_QUE_OFRECEN } from "@/lib/roles";
import { obtenerPerfil } from "@/lib/sesion";
import { territorioDeLaPeticion } from "@/lib/territorio-sesion";
import type { RolActor } from "@/db/schema";

export const metadata: Metadata = { title: "Mapa" };
export const dynamic = "force-dynamic";

const FILTROS_ROL: { valor: RolActor | "todos"; etiqueta: string; emoji: string }[] = [
  { valor: "todos", etiqueta: "Todos", emoji: "📍" },
  { valor: "prestador", etiqueta: "Prestadores", emoji: "🔧" },
  { valor: "negocio", etiqueta: "Comercios", emoji: "🏪" },
  { valor: "proveedor", etiqueta: "Proveedores", emoji: "📦" },
  { valor: "productor", etiqueta: "Productores", emoji: "🌾" },
];

export default async function PaginaMapa({
  searchParams,
}: {
  searchParams: Promise<{
    rol?: string;
    comuna?: string;
    categoria?: string;
    lat?: string;
    lng?: string;
    q?: string;
  }>;
}) {
  const { rol = "todos", comuna, categoria, lat: latParam, lng: lngParam, q = "" } = await searchParams;
  const perfil = await obtenerPerfil();

  const [territorio, opciones, explorado] = await Promise.all([
    opcionesTerritorio(),
    opcionesCategoria(),
    territorioDeLaPeticion(comuna),
  ]);

  const geoLat = latParam ? Number(latParam) : null;
  const geoLng = lngParam ? Number(lngParam) : null;
  const miUbicacion =
    geoLat !== null && geoLng !== null && !Number.isNaN(geoLat) && !Number.isNaN(geoLng)
      ? { lat: geoLat, lng: geoLng }
      : null;

  // La geolocalización solo decide la comuna cuando el visitante no la eligió
  // a mano: si viene "comuna" en la URL, esa elección manda.
  const comunaGeolocalizada = miUbicacion && !comuna ? await comunaMasCercana(miUbicacion.lat, miUbicacion.lng) : null;

  const ubicacion = comunaGeolocalizada
    ? await ubicacionDeComuna(comunaGeolocalizada.id)
    : explorado.comuna;
  const comunaId = ubicacion?.id ?? null;

  // "Buscar en esta zona": el texto pasa por el mismo intérprete que el
  // buscador general, pero la zona la fija el mapa, no la frase.
  const intencion = await interpretar(q, await contextoInterprete(comunaId));
  intencion.comunaId = comunaId;
  if (Number(categoria)) intencion.categoriaId = Number(categoria);

  const desde = miUbicacion ?? (perfil?.lat && perfil?.lng ? { lat: perfil.lat, lng: perfil.lng } : null);

  const actores = await buscarActores(intencion, {
    desde,
    roles: (ROLES_QUE_OFRECEN as string[]).includes(rol) ? [rol as RolActor] : ROLES_QUE_OFRECEN,
    limite: 120,
    soloConUbicacion: true,
    conSesion: Boolean(perfil),
  });

  let centro: { lat: number; lng: number } = { lat: -33.45, lng: -70.66 };
  if (miUbicacion) {
    centro = miUbicacion;
  } else if (ubicacion) {
    centro = { lat: ubicacion.lat, lng: ubicacion.lng };
  }

  const activarGeolocalizacion = !explorado.explicito && !miUbicacion;

  const puntos: PuntoMapa[] = actores.map((a) => ({
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
    reputacionConteo: a.reputacionConteo,
    avatarUrl: a.avatarUrl,
    distancia: a.distanciaKm !== null ? formatearDistancia(a.distanciaKm) : null,
  }));

  const enlace = (cambios: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base = {
      rol,
      comuna: comuna ?? (miUbicacion ? undefined : String(comunaId ?? "")),
      categoria,
      lat: latParam,
      lng: lngParam,
      q: q || undefined,
      ...cambios,
    };
    for (const [clave, valor] of Object.entries(base)) {
      if (valor && valor !== "todos") p.set(clave, valor);
    }
    return `/mapa?${p.toString()}`;
  };

  return (
    <div className="space-y-5">
      <Encabezado
        titulo="Mapa"
        bajada="Explora negocios, prestadores y productos cerca de ti. Toca un punto para ver su ficha."
      />

      <GeolocalizarMapa activo={activarGeolocalizacion} />

      <IndicadorTerritorio
        explorado={{ comuna: ubicacion, explicito: explorado.explicito }}
        territorio={territorio}
        volver={enlace({ comuna: undefined, lat: undefined, lng: undefined })}
      />

      <div className="flex items-start gap-2">
        <form action="/mapa" role="search" className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tenue"
          />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar en esta zona"
            aria-label="Buscar en esta zona"
            className="campo h-10 pl-10 text-sm"
          />
          {rol !== "todos" ? <input type="hidden" name="rol" value={rol} /> : null}
          {comunaId ? <input type="hidden" name="comuna" value={comunaId} /> : null}
          {categoria ? <input type="hidden" name="categoria" value={categoria} /> : null}
          {latParam && lngParam ? (
            <>
              <input type="hidden" name="lat" value={latParam} />
              <input type="hidden" name="lng" value={lngParam} />
            </>
          ) : null}
        </form>

        <details className="group relative">
          <summary
            aria-label="Filtros"
            title="Filtros"
            className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-xl border border-borde bg-superficie text-tenue transition hover:bg-superficie2 group-open:text-marca [&::-webkit-details-marker]:hidden"
          >
            <SlidersHorizontal size={17} />
          </summary>
          <form
            action="/mapa"
            className="tarjeta absolute right-0 top-12 z-[600] grid w-64 gap-2 p-3 shadow-flotante"
          >
            {rol !== "todos" ? <input type="hidden" name="rol" value={rol} /> : null}
            {q ? <input type="hidden" name="q" value={q} /> : null}
            {comunaId ? <input type="hidden" name="comuna" value={comunaId} /> : null}
            <label className="text-xs text-tenue" htmlFor="filtro-categoria">
              Qué buscas
            </label>
            <SelectorCategoria
              opciones={opciones}
              nombre="categoria"
              id="filtro-categoria"
              inicial={Number(categoria) || null}
              niveles={["rubro", "subgrupo", "item", "oficio"]}
              placeholder="Todo"
              compacto
            />
            <button
              type="submit"
              className="mt-1 h-9 rounded-lg bg-marca px-3 text-xs font-medium text-white transition hover:bg-marca-fuerte"
            >
              Aplicar
            </button>
          </form>
        </details>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTROS_ROL.map((f) => (
          <Link
            key={f.valor}
            href={enlace({ rol: f.valor })}
            className={
              rol === f.valor
                ? "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-marca px-3 py-1.5 text-xs font-medium text-white"
                : "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-borde bg-superficie px-3 py-1.5 text-xs text-tenue transition hover:bg-superficie2"
            }
          >
            <span aria-hidden>{f.emoji}</span>
            {f.etiqueta}
          </Link>
        ))}
        {q ? (
          <Link
            href={enlace({ q: undefined })}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-marca/40 px-3 py-1.5 text-xs text-marca transition hover:bg-marca/10"
          >
            «{q}» · quitar
          </Link>
        ) : null}
      </div>

      {puntos.length || miUbicacion ? (
        <Mapa
          puntos={puntos}
          centro={centro}
          miUbicacion={miUbicacion}
          alto="62vh"
          fichaInferior
        />
      ) : (
        <Tarjeta className="grid place-items-center px-6 py-16 text-center">
          <p className="text-sm text-tenue">
            {ubicacion
              ? `Todavía no hay oferta en ${ubicacion.nombre} con estos filtros.`
              : "No hay oferta con estos filtros todavía."}{" "}
            Cambia de comuna arriba o quita filtros.
          </p>
        </Tarjeta>
      )}
      {miUbicacion && !puntos.length ? (
        <p className="text-center text-xs text-tenue">
          Te ubicamos{ubicacion ? ` en ${ubicacion.nombre}` : ""}, pero ahí todavía no hay oferta con estos filtros.
        </p>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="titulo-seccion">En el mapa ahora</h2>
          <Insignia tono="contorno">{actores.length} actores</Insignia>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {actores.slice(0, 12).map((actor) => (
            <TarjetaActor key={actor.id} actor={actor} />
          ))}
        </div>
      </section>
    </div>
  );
}

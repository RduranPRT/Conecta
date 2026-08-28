import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";

import { Mapa, type PuntoMapa } from "@/components/mapa";
import { TarjetaActor } from "@/components/tarjeta-actor";
import { Encabezado, Insignia, Tarjeta } from "@/components/ui";
import { db } from "@/db";
import { comunas } from "@/db/schema";
import { buscarActores } from "@/lib/casos/actores";
import { categoriasDisponibles, comunasActivas } from "@/lib/casos/perfil";
import { formatearDistancia } from "@/lib/geo";
import { intencionVacia } from "@/lib/ia/tipos";
import { obtenerPerfil } from "@/lib/sesion";
import type { RolActor } from "@/db/schema";

export const metadata: Metadata = { title: "Mapa" };
export const dynamic = "force-dynamic";

const FILTROS_ROL: { valor: RolActor | "todos"; etiqueta: string; emoji: string }[] = [
  { valor: "todos", etiqueta: "Todos", emoji: "📍" },
  { valor: "prestador", etiqueta: "Prestadores", emoji: "🔧" },
  { valor: "negocio", etiqueta: "Negocios", emoji: "🏪" },
  { valor: "proveedor", etiqueta: "Proveedores", emoji: "📦" },
  { valor: "productor", etiqueta: "Productores", emoji: "🌾" },
];

export default async function PaginaMapa({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string; comuna?: string; categoria?: string }>;
}) {
  const { rol = "todos", comuna, categoria } = await searchParams;
  const perfil = await obtenerPerfil();

  const [listaComunas, listaCategorias] = await Promise.all([
    comunasActivas(),
    categoriasDisponibles(),
  ]);

  const comunaId =
    Number(comuna) ||
    perfil?.comunaId ||
    listaComunas.find((c) => c.activa)?.id ||
    listaComunas[0]?.id ||
    null;

  const intencion = {
    ...intencionVacia(""),
    comunaId,
    categoriaId: Number(categoria) || null,
  };

  const actores = await buscarActores(intencion, {
    desde: perfil?.lat && perfil?.lng ? { lat: perfil.lat, lng: perfil.lng } : null,
    roles: rol !== "todos" ? [rol as RolActor] : ["prestador", "negocio", "proveedor", "productor"],
    limite: 120,
    soloConUbicacion: true,
  });

  const centro = comunaId
    ? await db.query.comunas
        .findFirst({ where: eq(comunas.id, comunaId) })
        .then((c) => (c ? { lat: c.lat, lng: c.lng } : { lat: -33.45, lng: -70.66 }))
    : { lat: -33.45, lng: -70.66 };

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
    distancia: a.distanciaKm !== null ? formatearDistancia(a.distanciaKm) : null,
  }));

  const enlace = (cambios: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base = { rol, comuna: comuna ?? String(comunaId ?? ""), categoria, ...cambios };
    for (const [clave, valor] of Object.entries(base)) {
      if (valor && valor !== "todos") p.set(clave, valor);
    }
    return `/mapa?${p.toString()}`;
  };

  return (
    <div className="space-y-5">
      <Encabezado
        titulo="Mapa"
        bajada="Explora tu comuna sin buscar nada. Cada tipo de actor tiene su propio icono; al tocar un punto ves la ficha resumida."
      />

      <div className="flex flex-wrap items-center gap-2">
        {FILTROS_ROL.map((f) => (
          <Link
            key={f.valor}
            href={enlace({ rol: f.valor })}
            className={
              rol === f.valor
                ? "inline-flex items-center gap-1.5 rounded-full bg-marca px-3 py-1.5 text-xs font-medium text-white"
                : "inline-flex items-center gap-1.5 rounded-full border border-borde bg-superficie px-3 py-1.5 text-xs text-tenue transition hover:bg-superficie2"
            }
          >
            <span aria-hidden>{f.emoji}</span>
            {f.etiqueta}
          </Link>
        ))}

        <form className="ml-auto flex items-center gap-2" action="/mapa">
          <input type="hidden" name="rol" value={rol} />
          <select
            name="comuna"
            defaultValue={comunaId ?? ""}
            className="campo h-9 w-auto py-1 text-xs"
            aria-label="Comuna"
          >
            {listaComunas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <select
            name="categoria"
            defaultValue={categoria ?? ""}
            className="campo h-9 w-auto py-1 text-xs"
            aria-label="Categoría"
          >
            <option value="">Todas las categorías</option>
            {listaCategorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-9 rounded-lg border border-borde px-3 text-xs text-tenue transition hover:bg-superficie2"
          >
            Aplicar
          </button>
        </form>
      </div>

      {puntos.length ? (
        <Mapa puntos={puntos} centro={centro} alto="62vh" />
      ) : (
        <Tarjeta className="grid place-items-center px-6 py-16 text-center">
          <p className="text-sm text-tenue">
            No hay actores con ubicación en esta selección todavía.
          </p>
        </Tarjeta>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="titulo-seccion">En el mapa ahora</h2>
          <Insignia tono="contorno">{actores.length} actores</Insignia>
        </div>
        <div className="grid gap-3">
          {actores.slice(0, 12).map((actor) => (
            <TarjetaActor key={actor.id} actor={actor} />
          ))}
        </div>
      </section>
    </div>
  );
}

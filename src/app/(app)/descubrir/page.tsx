import type { Metadata } from "next";
import Link from "next/link";

import { TarjetaPublicacion } from "@/components/tarjeta-publicacion";
import { BotonEnlace, Encabezado, Tarjeta, Vacio } from "@/components/ui";
import { feedPara } from "@/lib/casos/feed";
import { pulsoTerritorial } from "@/lib/casos/actividad";
import { obtenerPerfil } from "@/lib/sesion";

export const metadata: Metadata = { title: "Descubrir" };
export const dynamic = "force-dynamic";

const TIPOS = [
  { valor: "", etiqueta: "Todo" },
  { valor: "necesidad", etiqueta: "Necesidades" },
  { valor: "producto", etiqueta: "Productos" },
  { valor: "servicio", etiqueta: "Servicios" },
  { valor: "oferta", etiqueta: "Ofertas" },
  { valor: "novedad", etiqueta: "Novedades" },
] as const;

export default async function PaginaDescubrir({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; zona?: string }>;
}) {
  const { tipo = "", zona = "mi-zona" } = await searchParams;
  const perfil = await obtenerPerfil();

  const publicaciones = await feedPara({
    perfilId: perfil?.id ?? null,
    comunaId: perfil?.comunaId ?? null,
    tipo: (tipo || null) as never,
    soloMiZona: zona === "mi-zona",
    limite: 30,
  });

  const pulso = await pulsoTerritorial(perfil?.comunaId ?? null);

  const enlace = (cambios: Record<string, string>) => {
    const p = new URLSearchParams({ tipo, zona, ...cambios });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    return `/descubrir?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Descubrir"
        bajada="Lo que se ofrece, se necesita y se mueve en tu territorio. Cada publicación termina en una acción."
        acciones={
          <BotonEnlace href="/publicar" tamano="sm">
            Publicar
          </BotonEnlace>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {TIPOS.map((t) => (
          <Link
            key={t.valor || "todo"}
            href={enlace({ tipo: t.valor })}
            className={
              tipo === t.valor
                ? "rounded-full bg-marca px-3 py-1.5 text-xs font-medium text-white"
                : "rounded-full border border-borde bg-superficie px-3 py-1.5 text-xs text-tenue transition hover:bg-superficie2"
            }
          >
            {t.etiqueta}
          </Link>
        ))}

        <div className="ml-auto inline-flex rounded-xl border border-borde bg-superficie p-1">
          <Link
            href={enlace({ zona: "mi-zona" })}
            className={
              zona === "mi-zona"
                ? "rounded-lg bg-marca px-3 py-1.5 text-xs font-medium text-white"
                : "rounded-lg px-3 py-1.5 text-xs text-tenue hover:bg-superficie2"
            }
          >
            Mi zona
          </Link>
          <Link
            href={enlace({ zona: "todo" })}
            className={
              zona !== "mi-zona"
                ? "rounded-lg bg-marca px-3 py-1.5 text-xs font-medium text-white"
                : "rounded-lg px-3 py-1.5 text-xs text-tenue hover:bg-superficie2"
            }
          >
            Explorar fuera
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="grid gap-4">
          {publicaciones.length ? (
            publicaciones.map((p) => (
              <TarjetaPublicacion
                key={p.publicacion.id}
                publicacion={p.publicacion}
                autorNombre={p.autorNombre}
                autorSlug={p.autorSlug}
                autorAvatar={p.autorAvatar}
                comunaNombre={p.comunaNombre}
                categoriaNombre={p.categoriaNombre}
                reacciones={Number(p.reacciones)}
                reaccionada={Boolean(p.reaccionada)}
                patrocinado={p.patrocinado}
                motivo={p.motivo}
                hayPerfil={Boolean(perfil)}
              />
            ))
          ) : (
            <Vacio
              titulo="El feed está vacío por ahora"
              descripcion="Publica un producto, un servicio o una necesidad y aparecerá aquí para tu territorio."
            >
              <BotonEnlace href="/publicar" tamano="sm">
                Publicar algo
              </BotonEnlace>
            </Vacio>
          )}
        </div>

        <aside className="hidden space-y-4 lg:block">
          <Tarjeta className="p-4">
            <h2 className="titulo-seccion">Pulso del territorio</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-tenue">Actores</dt>
                <dd className="font-medium text-texto">{pulso.actores}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-tenue">Necesidades abiertas</dt>
                <dd className="font-medium text-texto">{pulso.necesidadesAbiertas}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-tenue">Operaciones cerradas</dt>
                <dd className="font-medium text-texto">{pulso.operacionesCerradas}</dd>
              </div>
            </dl>
          </Tarjeta>

          {pulso.categoriasCalientes.length ? (
            <Tarjeta className="p-4">
              <h2 className="titulo-seccion">Más pedido este mes</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {pulso.categoriasCalientes.map((c) => (
                  <li key={c.nombre} className="flex justify-between">
                    <span className="text-tenue">{c.nombre}</span>
                    <span className="font-medium text-texto">{c.total}</span>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          ) : null}

          <Tarjeta className="p-4">
            <h2 className="titulo-seccion">Cómo funciona el feed</h2>
            <p className="mt-2 text-xs leading-relaxed text-tenue">
              El orden considera cercanía territorial, tus categorías, a quién sigues y qué tan
              reciente es cada publicación. Los contenidos patrocinados van marcados y nunca
              ocupan más de uno de cada cuatro lugares.
            </p>
          </Tarjeta>
        </aside>
      </div>
    </div>
  );
}

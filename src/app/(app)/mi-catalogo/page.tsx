import type { Metadata } from "next";
import Link from "next/link";

import { BotonEnlace, Encabezado, Insignia, Tarjeta, Vacio } from "@/components/ui";
import { publicacionesDe } from "@/lib/casos/feed";
import { monto } from "@/lib/formato";
import { requerirPerfil } from "@/lib/sesion";

export const metadata: Metadata = { title: "Mis productos y servicios" };
export const dynamic = "force-dynamic";

const TONO_TIPO: Record<string, "marca" | "acento" | "neutro" | "exito"> = {
  necesidad: "acento",
  producto: "marca",
  servicio: "marca",
  oferta: "exito",
  oportunidad: "exito",
  novedad: "neutro",
};

export default async function PaginaMiCatalogo() {
  const perfil = await requerirPerfil("/mi-catalogo");
  const publicaciones = await publicacionesDe(perfil.id, 50);

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Mis productos y servicios"
        bajada="Lo que has publicado — productos, servicios y ofertas — visible en tu ficha y en el feed de tu territorio."
        acciones={
          <BotonEnlace href="/publicar?tipo=oferta" tamano="sm">
            Publicar algo nuevo
          </BotonEnlace>
        }
      />

      {publicaciones.length ? (
        <Tarjeta className="divide-y divide-borde">
          {publicaciones.map(({ publicacion, categoriaNombre, comunaNombre }) => (
            <Link
              key={publicacion.id}
              href={`/p/${perfil.slug}`}
              className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-superficie2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-texto">{publicacion.titulo}</p>
                  <Insignia tono={TONO_TIPO[publicacion.tipo] ?? "neutro"}>
                    {publicacion.tipo}
                  </Insignia>
                  {publicacion.estado === "pausada" ? (
                    <Insignia tono="alerta">Pausada</Insignia>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-tenue">
                  {categoriaNombre ?? "Sin categoría"} · {comunaNombre ?? "Sin comuna"}
                  {publicacion.precio ? ` · ${monto(publicacion.precio, publicacion.moneda)}` : ""}
                </p>
              </div>
            </Link>
          ))}
        </Tarjeta>
      ) : (
        <Vacio
          titulo="Todavía no has publicado nada"
          descripcion="Publica un producto, un servicio o una oferta y aparecerá aquí y en el feed de tu territorio."
        >
          <BotonEnlace href="/publicar?tipo=oferta" tamano="sm">
            Publicar ahora
          </BotonEnlace>
        </Vacio>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Package, Wrench } from "lucide-react";

import { BotonEnlace, Encabezado, Insignia, Tarjeta, Vacio } from "@/components/ui";
import { catalogoDe } from "@/lib/casos/catalogo";
import { publicacionesDe } from "@/lib/casos/feed";
import { monto } from "@/lib/formato";
import { requerirPerfil } from "@/lib/sesion";

import { BotonDisponibilidadItem } from "./formulario-item";

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

/**
 * Dos cosas distintas, en la misma pantalla: el catálogo (lo que ofreces de
 * forma permanente, visible en tu ficha y en el buscador) y las publicaciones
 * (avisos con fecha en el feed).
 */
export default async function PaginaMiCatalogo() {
  const perfil = await requerirPerfil("/mi-catalogo");
  const [catalogo, publicaciones] = await Promise.all([
    catalogoDe(perfil.id),
    publicacionesDe(perfil.id, { limite: 50, conSesion: true, incluirPausadas: true }),
  ]);

  return (
    <div className="space-y-8">
      <Encabezado
        titulo="Mis productos y servicios"
        bajada="Tu catálogo aparece en tu ficha y hace que te encuentren por el nombre de lo que vendes o haces."
        acciones={
          <BotonEnlace href="/mi-catalogo/nuevo" tamano="sm">
            Agregar
          </BotonEnlace>
        }
      />

      <section>
        <h2 className="titulo-seccion mb-3">Catálogo</h2>
        {catalogo.length ? (
          <Tarjeta className="divide-y divide-borde">
            {catalogo.map(({ item, categoriaNombre }) => {
              const Icono = item.tipo === "servicio" ? Wrench : Package;
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  {item.imagenUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imagenUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg border border-borde object-cover"
                    />
                  ) : (
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-superficie2 text-tenue">
                      <Icono size={18} />
                    </span>
                  )}
                  <Link href={`/mi-catalogo/${item.id}`} className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-texto">{item.nombre}</p>
                      {!item.activo ? <Insignia tono="alerta">Retirado</Insignia> : null}
                    </div>
                    <p className="mt-0.5 text-xs text-tenue">
                      {item.tipo === "servicio" ? "Servicio" : "Producto"}
                      {categoriaNombre ? ` · ${categoriaNombre}` : ""}
                      {item.precio
                        ? ` · ${monto(item.precio, item.moneda)}${item.unidad ? ` / ${item.unidad}` : ""}`
                        : ""}
                    </p>
                  </Link>
                  <BotonDisponibilidadItem itemId={item.id} activo={item.activo} />
                  <Link
                    href={`/mi-catalogo/${item.id}`}
                    aria-label={`Editar ${item.nombre}`}
                    className="text-tenue hover:text-texto"
                  >
                    <ChevronRight size={16} />
                  </Link>
                </div>
              );
            })}
          </Tarjeta>
        ) : (
          <Vacio
            titulo="Tu catálogo está vacío"
            descripcion="Agrega lo que vendes o los servicios que prestas, con precio y foto. Quien busque esos nombres te va a encontrar."
          >
            <BotonEnlace href="/mi-catalogo/nuevo" tamano="sm">
              Agregar el primero
            </BotonEnlace>
          </Vacio>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="titulo-seccion">Publicaciones en el feed</h2>
          <BotonEnlace href="/publicar?tipo=oferta" variante="secundario" tamano="sm">
            Publicar un aviso
          </BotonEnlace>
        </div>
        {publicaciones.length ? (
          <Tarjeta className="divide-y divide-borde">
            {publicaciones.map(({ publicacion, categoriaNombre, comunaNombre }) => (
              <Link
                key={publicacion.id}
                href={`/publicaciones/${publicacion.id}`}
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
          <p className="text-sm text-tenue">Todavía no has publicado avisos en el feed.</p>
        )}
      </section>
    </div>
  );
}

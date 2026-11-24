import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin } from "lucide-react";

import { AccionConSesion } from "@/components/accion-con-sesion";
import { EtiquetaSentido } from "@/components/etiqueta-sentido";
import { Avatar, Insignia, Tarjeta } from "@/components/ui";
import { itemPublico } from "@/lib/casos/ficha";
import { monto } from "@/lib/formato";
import { contactar } from "@/lib/publicaciones";
import { obtenerPerfil } from "@/lib/sesion";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string; id: string }>;

async function cargar(params: Params, conSesion: boolean) {
  const { slug, id } = await params;
  const numero = Number(id);
  return Number.isInteger(numero) && numero > 0 ? itemPublico(slug, numero, conSesion) : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const datos = await cargar(params, false);
  return { title: datos ? `${datos.item.nombre} · ${datos.perfil.nombre}` : "Catálogo" };
}

/** Detalle público de un producto o servicio del catálogo (N01, P07). */
export default async function PaginaItem({ params }: { params: Params }) {
  const yo = await obtenerPerfil();
  const datos = await cargar(params, Boolean(yo));
  if (!datos) notFound();
  const { item, perfil } = datos;
  const esMio = yo?.id === perfil.id;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href={`/p/${perfil.slug}#catalogo`}
        className="inline-flex items-center gap-1 text-xs text-tenue hover:text-texto"
      >
        <ChevronLeft size={14} />
        Catálogo de {perfil.nombre}
      </Link>

      <Tarjeta className="overflow-hidden">
        {item.imagenUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imagenUrl} alt={item.nombre} className="max-h-96 w-full object-cover" />
        ) : null}
        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <EtiquetaSentido tipo={item.tipo} />
            <Insignia tono="marca">{item.tipo === "servicio" ? "Servicio" : "Producto"}</Insignia>
            {item.categoriaNombre ? (
              <Link href={`/buscar?categoria=${item.categoriaId}`}>
                <Insignia tono="contorno">{item.categoriaNombre}</Insignia>
              </Link>
            ) : null}
          </div>
          <h1 className="text-xl font-semibold text-texto">{item.nombre}</h1>
          {item.precio ? (
            <p className="text-lg font-semibold text-texto">
              {monto(item.precio, item.moneda)}
              {item.unidad ? (
                <span className="text-sm font-normal text-tenue"> /{item.unidad}</span>
              ) : null}
            </p>
          ) : (
            <p className="text-sm text-tenue">Precio a consultar</p>
          )}
          {item.descripcion ? (
            <p className="whitespace-pre-line text-sm text-texto">{item.descripcion}</p>
          ) : null}

          <Link
            href={`/p/${perfil.slug}`}
            className="flex items-center gap-3 rounded-xl border border-borde p-3 transition hover:bg-superficie2"
          >
            <Avatar nombre={perfil.nombre} url={perfil.avatarUrl} tamano={40} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-texto">{perfil.nombre}</span>
              {perfil.comunaNombre ? (
                <span className="flex items-center gap-1 text-xs text-tenue">
                  <MapPin size={11} />
                  {perfil.comunaNombre}
                </span>
              ) : null}
            </span>
          </Link>

          {!esMio ? (
            <div className="flex flex-wrap gap-2">
              <AccionConSesion href={contactar(perfil.slug)} haySesion={Boolean(yo)}>
                Contactar
              </AccionConSesion>
              <AccionConSesion
                href={`/publicar?tipo=necesidad&q=${encodeURIComponent(item.nombre)}`}
                haySesion={Boolean(yo)}
                variante="secundario"
              >
                {item.tipo === "servicio" ? "Solicitar" : "Cotizar"}
              </AccionConSesion>
            </div>
          ) : null}
        </div>
      </Tarjeta>
    </div>
  );
}

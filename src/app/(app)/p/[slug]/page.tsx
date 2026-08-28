import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, Globe, MapPin, Phone } from "lucide-react";

import { TarjetaPublicacion } from "@/components/tarjeta-publicacion";
import { Avatar, BotonEnlace, Encabezado, Estrellas, Insignia, Tarjeta } from "@/components/ui";
import { publicacionesDe } from "@/lib/casos/feed";
import { perfilPublico } from "@/lib/casos/perfil";
import { fecha, monto } from "@/lib/formato";
import { obtenerPerfil } from "@/lib/sesion";

import { FormularioContacto } from "./contacto";

export const dynamic = "force-dynamic";

const ETIQUETA_ROL: Record<string, string> = {
  persona: "Persona",
  prestador: "Prestador de servicios",
  negocio: "Negocio",
  proveedor: "Proveedor",
  productor: "Productor",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ficha = await perfilPublico(slug);
  return { title: ficha?.nombre ?? "Perfil" };
}

export default async function PaginaPerfil({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ficha = await perfilPublico(slug);
  if (!ficha) notFound();

  const [publicaciones, yo] = await Promise.all([publicacionesDe(ficha.id, 8), obtenerPerfil()]);
  const verificado = ficha.verificaciones.some((v) => v.estado === "verificado");
  const esMio = yo?.id === ficha.id;

  return (
    <div className="space-y-8">
      <Tarjeta className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar nombre={ficha.nombre} url={ficha.avatarUrl} tamano={72} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-texto">{ficha.nombre}</h1>
              {verificado ? (
                <span title="Perfil verificado" className="text-marca">
                  <BadgeCheck size={18} />
                </span>
              ) : null}
              {ficha.disponibleAhora ? <Insignia tono="exito">Disponible ahora</Insignia> : null}
            </div>

            <p className="mt-1 text-sm text-tenue">
              {ficha.roles.map((r) => ETIQUETA_ROL[r] ?? r).join(" · ")}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-tenue">
              {ficha.comunaNombre ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} />
                  {ficha.comunaNombre}
                  {ficha.regionNombre ? `, ${ficha.regionNombre}` : ""}
                </span>
              ) : null}
              {ficha.telefono ? (
                <span className="inline-flex items-center gap-1">
                  <Phone size={12} />
                  {ficha.telefono}
                </span>
              ) : null}
              {ficha.sitioWeb ? (
                <a
                  href={ficha.sitioWeb}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 hover:text-texto"
                >
                  <Globe size={12} />
                  Sitio web
                </a>
              ) : null}
              <Estrellas valor={ficha.reputacionPromedio} conteo={ficha.reputacionConteo} />
              <span>Miembro desde {fecha(ficha.creadoEn)}</span>
            </div>

            {ficha.descripcion ? (
              <p className="mt-3 whitespace-pre-line text-sm text-texto">{ficha.descripcion}</p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-1.5">
              {ficha.categorias.map((c) => (
                <Insignia key={c.id} tono="marca">
                  {c.nombre}
                </Insignia>
              ))}
            </div>

            {ficha.radioKm ? (
              <p className="mt-3 text-xs text-tenue">
                Atiende a domicilio en un radio de {ficha.radioKm} km.
              </p>
            ) : null}
            {ficha.cobertura.length > 1 ? (
              <p className="mt-1 text-xs text-tenue">
                Cobertura: {ficha.cobertura.map((c) => c.nombre).join(", ")}.
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col gap-2">
            {esMio ? (
              <BotonEnlace href="/mi-perfil" variante="secundario" tamano="sm">
                Editar ficha
              </BotonEnlace>
            ) : (
              <BotonEnlace href="#contacto" tamano="sm">
                Contactar
              </BotonEnlace>
            )}
            <div className="rounded-xl border border-borde px-3 py-2 text-center">
              <p className="text-lg font-semibold text-texto">{ficha.operacionesCompletadas}</p>
              <p className="text-[11px] leading-tight text-tenue">operaciones</p>
            </div>
          </div>
        </div>
      </Tarjeta>

      {ficha.catalogo.length ? (
        <section>
          <Encabezado titulo="Catálogo" />
          <div className="grid gap-3 sm:grid-cols-2">
            {ficha.catalogo.map((item) => (
              <Tarjeta key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-texto">{item.nombre}</p>
                    {item.descripcion ? (
                      <p className="mt-1 text-xs text-tenue">{item.descripcion}</p>
                    ) : null}
                  </div>
                  {item.precio ? (
                    <p className="shrink-0 text-sm font-semibold text-texto">
                      {monto(item.precio, item.moneda)}
                      {item.unidad ? (
                        <span className="text-xs font-normal text-tenue"> /{item.unidad}</span>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              </Tarjeta>
            ))}
          </div>
        </section>
      ) : null}

      {publicaciones.length ? (
        <section>
          <Encabezado titulo="Publicaciones" />
          <div className="grid gap-4">
            {publicaciones.map(({ publicacion, categoriaNombre, comunaNombre }) => (
              <TarjetaPublicacion
                key={publicacion.id}
                publicacion={publicacion}
                autorNombre={ficha.nombre}
                autorSlug={ficha.slug}
                autorAvatar={ficha.avatarUrl}
                comunaNombre={comunaNombre}
                categoriaNombre={categoriaNombre}
                reacciones={0}
                reaccionada={false}
                patrocinado={false}
                motivo=""
                hayPerfil={Boolean(yo)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <Encabezado titulo="Reseñas" />
        {ficha.resenas.length ? (
          <Tarjeta className="divide-y divide-borde">
            {ficha.resenas.map(({ calificacion, autorNombre }) => (
              <div key={calificacion.id} className="px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-texto">{autorNombre}</p>
                  <span className="text-xs text-alerta">
                    {"★".repeat(calificacion.puntaje)}
                    <span className="text-tenue">{"★".repeat(5 - calificacion.puntaje)}</span>
                  </span>
                </div>
                {calificacion.comentario ? (
                  <p className="mt-1 text-sm text-tenue">{calificacion.comentario}</p>
                ) : null}
                <p className="mt-1 text-[11px] text-tenue">{fecha(calificacion.creadoEn)}</p>
              </div>
            ))}
          </Tarjeta>
        ) : (
          <Tarjeta className="px-4 py-6 text-center text-sm text-tenue">
            Todavía no tiene reseñas. La reputación se gana con operaciones reales: no se compra
            ni se edita.
          </Tarjeta>
        )}
      </section>

      {!esMio ? (
        <section id="contacto">
          <Encabezado titulo="Contactar" />
          <Tarjeta className="p-5">
            {yo ? (
              <FormularioContacto perfilId={ficha.id} nombre={ficha.nombre} />
            ) : (
              <p className="text-sm text-tenue">
                <a href="/ingresar" className="font-medium text-marca hover:underline">
                  Ingresa
                </a>{" "}
                para escribirle a {ficha.nombre}.
              </p>
            )}
          </Tarjeta>
        </section>
      ) : null}
    </div>
  );
}

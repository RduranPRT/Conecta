import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Package, Wrench } from "lucide-react";

import { AccionConSesion, EnlaceSinSesion } from "@/components/accion-con-sesion";
import { Mapa } from "@/components/mapa";
import { TarjetaPublicacion } from "@/components/tarjeta-publicacion";
import {
  Avatar,
  BotonEnlace,
  claseBoton,
  Encabezado,
  Estrellas,
  Insignia,
  Tarjeta,
} from "@/components/ui";
import { publicacionesDe } from "@/lib/casos/feed";
import { perfilPublico } from "@/lib/casos/ficha";
import { fecha, monto, rolesVisibles } from "@/lib/formato";
import { contactar } from "@/lib/publicaciones";
import { etiquetaRoles, ofreceAlgo } from "@/lib/roles";
import { obtenerPerfil } from "@/lib/sesion";

import { DatosContacto, FormularioContacto } from "./contacto";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ficha = await perfilPublico(slug, false);
  return { title: ficha?.nombre ?? "Perfil" };
}

export default async function PaginaPerfil({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ accion?: string }>;
}) {
  const [{ slug }, { accion }, yo] = await Promise.all([params, searchParams, obtenerPerfil()]);
  const haySesion = Boolean(yo);
  const ficha = await perfilPublico(slug, haySesion);
  if (!ficha) notFound();

  const publicaciones = await publicacionesDe(ficha.id, { limite: 8, conSesion: haySesion });
  const esMio = yo?.id === ficha.id;
  const ofrece = ofreceAlgo(ficha.roles);
  const quiereContactar = accion === "contactar";
  // El punto exacto se muestra solo de quien ofrece algo y lo fijó (D5).
  const conPunto = ofrece && ficha.ubicacionExacta && ficha.lat !== null && ficha.lng !== null;

  return (
    <div className="space-y-8">
      <Tarjeta className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar nombre={ficha.nombre} url={ficha.avatarUrl} tamano={72} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-texto">{ficha.nombre}</h1>
              {ficha.verificado ? (
                <span title="Perfil verificado" className="text-marca">
                  <BadgeCheck size={18} />
                </span>
              ) : null}
              {ficha.disponibleAhora ? <Insignia tono="exito">Disponible ahora</Insignia> : null}
            </div>

            <p className="mt-1 text-sm text-tenue">
              {ficha.tipoIdentidad === "empresa" ? "Empresa · " : ""}
              {etiquetaRoles(rolesVisibles(ficha.roles))}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-tenue">
              {ficha.comunaNombre ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} />
                  {ofrece && ficha.direccion ? `${ficha.direccion}, ` : ""}
                  {ficha.comunaNombre}
                  {ficha.regionNombre ? `, ${ficha.regionNombre}` : ""}
                </span>
              ) : null}
              <Estrellas valor={ficha.reputacionPromedio} conteo={ficha.reputacionConteo} />
              <span>Miembro desde {fecha(ficha.creadoEn)}</span>
            </div>

            {ficha.descripcion ? (
              <p className="mt-3 whitespace-pre-line text-sm text-texto">{ficha.descripcion}</p>
            ) : null}

            {ficha.categorias.length || ficha.otrasActividades.length ? (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-texto">Ofrece:</span>
                {ficha.categorias.map((c) => (
                  <Link key={c.id} href={`/buscar?categoria=${c.id}`}>
                    <Insignia tono="marca">{c.nombre}</Insignia>
                  </Link>
                ))}
                {ficha.otrasActividades.map((texto) => (
                  <Insignia key={texto} tono="contorno">
                    {texto}
                  </Insignia>
                ))}
              </div>
            ) : null}

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
              <AccionConSesion href={contactar(ficha.slug)} haySesion={haySesion} tamano="sm">
                Contactar
              </AccionConSesion>
            )}
            <div className="rounded-xl border border-borde px-3 py-2 text-center">
              <p className="text-lg font-semibold text-texto">{ficha.operacionesCompletadas}</p>
              <p className="text-[11px] leading-tight text-tenue">operaciones</p>
            </div>
          </div>
        </div>
      </Tarjeta>

      {!esMio && haySesion ? (
        <section id="contacto" className="scroll-mt-32">
          <Encabezado nivel={2} titulo="Contactar" />
          <Tarjeta className="space-y-4 p-5">
            <DatosContacto perfilId={ficha.id} abrir={quiereContactar} />
            <FormularioContacto
              perfilId={ficha.id}
              nombre={ficha.nombre}
              enfocar={quiereContactar}
            />
          </Tarjeta>
        </section>
      ) : null}

      {ficha.catalogo.length ? (
        <section id="catalogo" className="scroll-mt-32">
          <Encabezado nivel={2} titulo="Catálogo" />
          <div className="grid gap-3 sm:grid-cols-2">
            {ficha.catalogo.map((item) => {
              const Icono = item.tipo === "servicio" ? Wrench : Package;
              return (
                <article key={item.id} className="tarjeta relative flex gap-3 p-3">
                  {item.imagenUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imagenUrl}
                      alt={item.nombre}
                      loading="lazy"
                      className="h-20 w-20 shrink-0 rounded-xl border border-borde object-cover"
                    />
                  ) : (
                    <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-superficie2 text-tenue">
                      <Icono size={22} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wide text-tenue">
                      {item.tipo === "servicio" ? "Servicio" : "Producto"}
                    </p>
                    <h3 className="text-sm font-medium text-texto">
                      <Link
                        href={`/p/${ficha.slug}/catalogo/${item.id}`}
                        className="after:absolute after:inset-0"
                      >
                        {item.nombre}
                      </Link>
                    </h3>
                    {item.descripcion ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-tenue">{item.descripcion}</p>
                    ) : null}
                    {item.precio ? (
                      <p className="mt-1 text-sm font-semibold text-texto">
                        {monto(item.precio, item.moneda)}
                        {item.unidad ? (
                          <span className="text-xs font-normal text-tenue"> /{item.unidad}</span>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {conPunto ? (
        <section>
          <Encabezado nivel={2} titulo="Dónde está" />
          <Mapa
            puntos={[
              {
                id: ficha.id,
                nombre: ficha.nombre,
                slug: ficha.slug,
                lat: ficha.lat!,
                lng: ficha.lng!,
                rol: rolesVisibles(ficha.roles)[0] ?? "persona",
                comuna: ficha.comunaNombre,
                categoria: ficha.categorias[0]?.nombre ?? null,
                disponible: ficha.disponibleAhora,
                reputacion: ficha.reputacionPromedio,
                distancia: null,
              },
            ]}
            centro={{ lat: ficha.lat!, lng: ficha.lng! }}
            zoom={15}
            alto="14rem"
          />
        </section>
      ) : null}

      {publicaciones.length ? (
        <section>
          <Encabezado nivel={2} titulo="Publicaciones" />
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
                guardada={false}
                patrocinado={false}
                motivo=""
                haySesion={haySesion}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <Encabezado nivel={2} titulo="Reseñas" />
        {ficha.resenas.length ? (
          <Tarjeta className="divide-y divide-borde">
            {ficha.resenas.map((r) => (
              <div key={r.id} className="px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-texto">{r.autorNombre}</p>
                  <span className="text-xs text-alerta">
                    {"★".repeat(r.puntaje)}
                    <span className="text-tenue">{"★".repeat(5 - r.puntaje)}</span>
                  </span>
                </div>
                {r.comentario ? <p className="mt-1 text-sm text-tenue">{r.comentario}</p> : null}
                <p className="mt-1 text-[11px] text-tenue">{fecha(r.creadoEn)}</p>
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

      {!haySesion ? (
        <section id="contacto" className="scroll-mt-32">
          <Tarjeta className="flex flex-col items-center gap-3 px-5 py-6 text-center">
            <p className="text-sm text-tenue">
              El teléfono, el correo y los mensajes están disponibles con tu cuenta.
            </p>
            <EnlaceSinSesion
              next={contactar(ficha.slug)}
              className={claseBoton({ tamano: "md" })}
            >
              Contactar a {ficha.nombre}
            </EnlaceSinSesion>
          </Tarjeta>
        </section>
      ) : null}
    </div>
  );
}

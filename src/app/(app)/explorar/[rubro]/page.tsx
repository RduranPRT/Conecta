import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { AccionConSesion } from "@/components/accion-con-sesion";
import { BotonEnlace, Encabezado, Insignia, Tarjeta } from "@/components/ui";
import { rubroPorSlug } from "@/lib/casos/categorias";
import { obtenerPerfil } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rubro: string }>;
}): Promise<Metadata> {
  const { rubro } = await params;
  const datos = await rubroPorSlug(rubro);
  return { title: datos?.nombre ?? "Explorar" };
}

function oferta(perfiles: number) {
  if (!perfiles) return "sin oferta aún";
  return `${perfiles} ${perfiles === 1 ? "perfil" : "perfiles"}`;
}

/**
 * Un rubro, sus subgrupos y lo concreto de cada uno (S14). Lo que también vive
 * en otro rubro aparece aquí igual: es lo mismo, visto desde otra puerta (C02).
 */
export default async function PaginaRubro({ params }: { params: Promise<{ rubro: string }> }) {
  const { rubro } = await params;
  const [datos, perfil] = await Promise.all([rubroPorSlug(rubro), obtenerPerfil()]);
  if (!datos) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/explorar"
        className="inline-flex items-center gap-1 text-xs text-tenue hover:text-texto"
      >
        <ChevronLeft size={14} />
        Todas las áreas
      </Link>

      <Encabezado
        titulo={`${datos.icono ?? ""} ${datos.nombre}`.trim()}
        bajada={datos.ejemplos ?? undefined}
        acciones={
          <BotonEnlace href={`/buscar?categoria=${datos.id}`} variante="secundario" tamano="sm">
            Ver todo
          </BotonEnlace>
        }
      />

      <Tarjeta className="divide-y divide-borde">
        {datos.subgrupos.map((s) => (
          <details key={s.id} className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 transition hover:bg-superficie2 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-texto">{s.nombre}</span>
                  {s.tipo === "producto" ? <Insignia tono="contorno">Productos</Insignia> : null}
                  {s.tipo === "ambos" ? (
                    <Insignia tono="contorno">Productos y servicios</Insignia>
                  ) : null}
                </span>
                {s.ejemplos ? (
                  <span className="mt-0.5 block text-xs text-tenue">{s.ejemplos}</span>
                ) : null}
              </span>
              <span className="shrink-0 text-xs text-tenue">{oferta(s.perfiles)}</span>
              <ChevronDown
                size={16}
                className="shrink-0 text-tenue transition group-open:rotate-180"
              />
            </summary>
            <div className="border-t border-borde bg-superficie2/50 px-4 py-2">
              <Link
                href={`/buscar?categoria=${s.id}`}
                className="flex items-center justify-between py-2 text-sm font-medium text-marca"
              >
                Ver todo {s.nombre}
                <ChevronRight size={16} />
              </Link>
              <ul>
                {s.items.map((i) => (
                  <li key={i.id}>
                    <Link
                      href={`/buscar?categoria=${i.id}`}
                      className="flex items-center justify-between gap-3 py-2 text-sm text-texto hover:text-marca"
                    >
                      {i.nombre}
                      <span className="shrink-0 text-xs text-tenue">{oferta(i.perfiles)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {s.oficios.length ? (
                <p className="flex flex-wrap items-center gap-1.5 py-2 text-xs text-tenue">
                  Por oficio:
                  {s.oficios.map((o) => (
                    <Link key={o.id} href={`/buscar?categoria=${o.id}`}>
                      <Insignia tono="contorno">{o.nombre}</Insignia>
                    </Link>
                  ))}
                </p>
              ) : null}
            </div>
          </details>
        ))}
      </Tarjeta>

      <p className="text-center text-xs text-tenue">
        ¿No ves lo que buscas?{" "}
        <AccionConSesion
          sinEstilo
          href="/publicar?tipo=necesidad"
          haySesion={Boolean(perfil)}
          className="font-medium text-marca hover:underline"
        >
          Publícalo como necesidad
        </AccionConSesion>{" "}
        y les avisamos a quienes pueden resolverlo.
      </p>
    </div>
  );
}

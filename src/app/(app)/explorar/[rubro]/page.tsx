import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

/**
 * Un rubro y sus especialidades. Las que también viven en otro rubro aparecen
 * aquí igual: es la misma especialidad, vista desde otra puerta (C02).
 */
export default async function PaginaRubro({ params }: { params: Promise<{ rubro: string }> }) {
  const { rubro } = await params;
  const [datos, perfil] = await Promise.all([rubroPorSlug(rubro), obtenerPerfil()]);
  if (!datos) notFound();

  return (
    <div className="space-y-6">
      <Link href="/explorar" className="inline-flex items-center gap-1 text-xs text-tenue hover:text-texto">
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
        {datos.especialidades.map((e) => (
          <Link
            key={e.id}
            href={`/buscar?categoria=${e.id}`}
            className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-superficie2"
          >
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-texto">{e.nombre}</span>
                {e.tipo === "producto" ? <Insignia tono="contorno">Productos</Insignia> : null}
                {e.tipo === "ambos" ? <Insignia tono="contorno">Productos y servicios</Insignia> : null}
              </span>
              {e.ejemplos ? <span className="mt-0.5 block text-xs text-tenue">{e.ejemplos}</span> : null}
            </span>
            <span className="shrink-0 text-xs text-tenue">
              {e.perfiles ? `${e.perfiles} ${e.perfiles === 1 ? "perfil" : "perfiles"}` : "sin oferta aún"}
            </span>
            <ChevronRight size={16} className="shrink-0 text-tenue" />
          </Link>
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
        y te avisamos a quienes pueden resolverlo.
      </p>
    </div>
  );
}

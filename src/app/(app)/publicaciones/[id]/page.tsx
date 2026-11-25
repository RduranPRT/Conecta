import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { TarjetaPublicacion } from "@/components/tarjeta-publicacion";
import { publicacionPublica } from "@/lib/casos/feed";
import { obtenerPerfil } from "@/lib/sesion";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const id = Number((await params).id);
  const fila = Number.isInteger(id) ? await publicacionPublica(id, null) : null;
  return { title: fila?.publicacion.titulo ?? "Publicación" };
}

/** Detalle público de una publicación: se puede compartir y volver a ella. */
export default async function PaginaPublicacion({ params }: { params: Params }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const perfil = await obtenerPerfil();
  const fila = await publicacionPublica(id, perfil?.id ?? null);
  if (!fila) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/descubrir"
        className="inline-flex items-center gap-1 text-xs text-tenue hover:text-texto"
      >
        <ChevronLeft size={14} />
        Todas las publicaciones
      </Link>
      <TarjetaPublicacion
        publicacion={fila.publicacion}
        autorNombre={fila.autorNombre}
        autorSlug={fila.autorSlug}
        autorAvatar={fila.autorAvatar}
        comunaNombre={fila.comunaNombre}
        categoriaNombre={fila.categoriaNombre}
        reacciones={Number(fila.reacciones)}
        reaccionada={Boolean(fila.reaccionada)}
        guardada={Boolean(fila.guardada)}
        patrocinado={false}
        motivo=""
        haySesion={Boolean(perfil)}
      />
    </div>
  );
}

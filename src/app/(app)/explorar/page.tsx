import type { Metadata } from "next";
import Link from "next/link";

import { BotonEnlace, Encabezado, Tarjeta } from "@/components/ui";
import { rubrosConOferta } from "@/lib/casos/categorias";
import { obtenerPerfil } from "@/lib/sesion";

export const metadata: Metadata = { title: "Explorar" };
export const dynamic = "force-dynamic";

/**
 * Explorar sin cuenta (S02) y llegar a una necesidad concreta sin saber el
 * nombre del oficio (S14): rubro → especialidad → quién lo ofrece.
 */
export default async function PaginaExplorar() {
  const [rubros, perfil] = await Promise.all([rubrosConOferta(), obtenerPerfil()]);

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Explorar"
        bajada="Elige un área para ver qué hay, o escribe arriba lo que necesitas. No necesitas cuenta para mirar."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rubros.map((r) => (
          <Link key={r.id} href={`/explorar/${r.slug}`} className="group">
            <Tarjeta className="flex h-full items-start gap-3 p-4 transition group-hover:bg-superficie2">
              <span aria-hidden className="text-2xl leading-none">
                {r.icono}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-texto">{r.nombre}</span>
                <span className="mt-0.5 block text-xs text-tenue">{r.ejemplos}</span>
                <span className="mt-2 block text-[11px] text-marca">
                  {r.perfiles
                    ? `${r.perfiles} ${r.perfiles === 1 ? "perfil ofrece" : "perfiles ofrecen"} algo aquí`
                    : "Todavía sin oferta: sé el primero"}
                </span>
              </span>
            </Tarjeta>
          </Link>
        ))}
      </div>

      {!perfil ? (
        <Tarjeta className="flex flex-col items-center gap-3 px-6 py-8 text-center">
          <p className="text-sm font-medium text-texto">¿Ofreces algo de esto o quieres pedir algo?</p>
          <p className="max-w-md text-xs text-tenue">
            Con una cuenta gratis puedes publicar lo que necesitas, contactar a quien ofrece y
            aparecer tú también en el buscador.
          </p>
          <BotonEnlace href="/registro" tamano="sm">
            Crear mi cuenta
          </BotonEnlace>
        </Tarjeta>
      ) : null}
    </div>
  );
}

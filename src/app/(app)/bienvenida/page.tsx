import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Megaphone, Search, Store } from "lucide-react";

import { BotonEnlace, Tarjeta } from "@/components/ui";
import { puedeOfrecer, requerirPerfil } from "@/lib/sesion";

export const metadata: Metadata = { title: "Tu perfil está listo" };
export const dynamic = "force-dynamic";

/**
 * Confirmación del registro (S08) y primer paso concreto (S10): queda claro
 * que la cuenta se creó y qué se puede hacer ahora mismo.
 */
export default async function PaginaBienvenida() {
  const perfil = await requerirPerfil("/bienvenida");
  const ofrece = puedeOfrecer(perfil);

  const acciones = [
    {
      href: "/buscar",
      icono: Search,
      titulo: "Buscar algo",
      texto: "Un servicio, un producto o un proveedor cerca de ti.",
    },
    {
      href: "/publicar?tipo=necesidad",
      icono: Megaphone,
      titulo: "Publicar lo que necesitas",
      texto: "Cuéntalo una vez y te avisamos a quienes pueden resolverlo.",
    },
    ofrece
      ? {
          href: "/mi-catalogo/nuevo",
          icono: Store,
          titulo: "Agregar lo que ofreces",
          texto: "Tus productos o servicios, con precio y foto, para que te encuentren.",
        }
      : {
          href: "/mi-perfil",
          icono: Store,
          titulo: "Ofrecer algo también",
          texto: "Si vendes o prestas servicios, actívalo en tu perfil. Es la misma cuenta.",
        },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Tarjeta className="flex flex-col items-center gap-3 px-6 py-8 text-center">
        <CheckCircle2 size={40} className="text-exito" aria-hidden />
        <h1 className="text-xl font-semibold text-texto">Listo, {perfil.nombre}: tu perfil está creado</h1>
        <p className="max-w-md text-sm text-tenue">
          Ya apareces en Conecta{perfil.comunaNombre ? ` en ${perfil.comunaNombre}` : ""}. Puedes
          completar o cambiar tus datos cuando quieras desde Mi perfil.
        </p>
      </Tarjeta>

      <section>
        <h2 className="titulo-seccion mb-3">¿Qué quieres hacer ahora?</h2>
        <Tarjeta className="divide-y divide-borde">
          {acciones.map(({ href, icono: Icono, titulo, texto }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 px-4 py-4 transition hover:bg-superficie2"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-marca/10 text-marca">
                <Icono size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-texto">{titulo}</span>
                <span className="block text-xs text-tenue">{texto}</span>
              </span>
              <ChevronRight size={16} className="text-tenue" />
            </Link>
          ))}
        </Tarjeta>
      </section>

      <div className="text-center">
        <BotonEnlace href="/" variante="fantasma" tamano="sm">
          Ir al inicio
        </BotonEnlace>
      </div>
    </div>
  );
}

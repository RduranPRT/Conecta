"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bot,
  Compass,
  Home,
  Map,
  MessageSquare,
  PlusCircle,
  Search,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Navegación principal del prompt. La misma lista alimenta la barra lateral en
 * escritorio y la barra inferior en teléfono: una sola definición, dos formas.
 */
export const NAVEGACION = [
  { href: "/inicio", etiqueta: "Inicio", icono: Home, movil: true },
  { href: "/buscar", etiqueta: "Buscar", icono: Search, movil: true },
  { href: "/mapa", etiqueta: "Mapa", icono: Map, movil: true },
  { href: "/descubrir", etiqueta: "Descubrir", icono: Compass, movil: false },
  { href: "/publicar", etiqueta: "Publicar", icono: PlusCircle, movil: true },
  { href: "/mensajes", etiqueta: "Mensajes", icono: MessageSquare, movil: false },
  { href: "/actividad", etiqueta: "Actividad", icono: Activity, movil: false },
  { href: "/asistente", etiqueta: "Asistente IA", icono: Bot, movil: true },
  { href: "/mi-perfil", etiqueta: "Mi perfil", icono: UserRound, movil: false },
] as const;

function activo(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLateral({ sinLeer = 0 }: { sinLeer?: number }) {
  const pathname = usePathname();

  return (
    <nav className="hidden w-56 shrink-0 lg:block">
      <ul className="sticky top-20 space-y-0.5">
        {NAVEGACION.map(({ href, etiqueta, icono: Icono }) => {
          const esActivo = activo(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                  esActivo
                    ? "bg-marca/10 font-medium text-marca"
                    : "text-tenue hover:bg-superficie2 hover:text-texto",
                )}
              >
                <Icono className="shrink-0" strokeWidth={esActivo ? 2.2 : 1.8} size={18} />
                {etiqueta}
                {href === "/mensajes" && sinLeer > 0 ? (
                  <span className="ml-auto rounded-full bg-marca px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {sinLeer}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function NavInferior() {
  const pathname = usePathname();
  const items = NAVEGACION.filter((i) => i.movil);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-superficie/95 backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, etiqueta, icono: Icono }) => {
          const esActivo = activo(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] transition",
                  esActivo ? "text-marca" : "text-tenue",
                )}
              >
                <Icono size={20} strokeWidth={esActivo ? 2.2 : 1.8} />
                {etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

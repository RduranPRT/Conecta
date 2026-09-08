"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, UserCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Navegación principal, simplificada a pedido de Álvaro (propuesta de
 * simplificación, sep-2026): de nueve accesos de primer nivel a tres —
 * Inicio, Mapa, Mi Conecta. El resto de las pantallas (Buscar, Descubrir,
 * Publicar, Mensajes, Actividad, Asistente, Agentes, Mi perfil) no
 * desaparecen: se alcanzan desde Inicio o desde el hub de Mi Conecta. La
 * misma lista alimenta la barra lateral en escritorio y la barra inferior
 * en teléfono: una sola definición, dos formas.
 */
export const NAVEGACION = [
  { href: "/inicio", etiqueta: "Inicio", icono: Home, movil: true },
  { href: "/mapa", etiqueta: "Mapa", icono: Map, movil: true },
  { href: "/mi-conecta", etiqueta: "Mi Conecta", icono: UserCircle2, movil: true },
] as const;

function activo(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Rutas que hoy viven fuera de la barra pero siguen contando para marcar
 * "Mi Conecta" como activo cuando el usuario está en alguna de ellas. */
const RUTAS_MI_CONECTA = [
  "/mi-conecta",
  "/mensajes",
  "/actividad",
  "/mi-perfil",
  "/mi-catalogo",
  "/guardados",
  "/agentes",
  "/asistente",
  "/configuracion",
];

function activoConGrupo(pathname: string, href: string) {
  if (href === "/mi-conecta") return RUTAS_MI_CONECTA.some((r) => activo(pathname, r));
  return activo(pathname, href);
}

export function NavLateral({ sinLeer = 0 }: { sinLeer?: number }) {
  const pathname = usePathname();

  return (
    <nav className="hidden w-56 shrink-0 lg:block">
      <ul className="sticky top-20 space-y-0.5">
        {NAVEGACION.map(({ href, etiqueta, icono: Icono }) => {
          const esActivo = activoConGrupo(pathname, href);
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
                {href === "/mi-conecta" && sinLeer > 0 ? (
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

export function NavInferior({ sinLeer = 0 }: { sinLeer?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-superficie/95 backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {NAVEGACION.map(({ href, etiqueta, icono: Icono }) => {
          const esActivo = activoConGrupo(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[10px] transition",
                  esActivo ? "text-marca" : "text-tenue",
                )}
              >
                <Icono size={20} strokeWidth={esActivo ? 2.2 : 1.8} />
                {etiqueta}
                {href === "/mi-conecta" && sinLeer > 0 ? (
                  <span className="absolute right-6 top-1 rounded-full bg-marca px-1 text-[9px] font-semibold text-white">
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

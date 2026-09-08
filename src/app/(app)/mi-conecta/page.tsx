import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  Bookmark,
  Bot,
  ChevronRight,
  MessageSquare,
  Package,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Encabezado, Insignia, Tarjeta } from "@/components/ui";
import { mensajesSinLeer } from "@/lib/casos/mensajes";
import { requerirPerfil } from "@/lib/sesion";

export const metadata: Metadata = { title: "Mi Conecta" };
export const dynamic = "force-dynamic";

export default async function PaginaMiConecta() {
  const perfil = await requerirPerfil("/mi-conecta");
  const sinLeer = await mensajesSinLeer(perfil.id);

  type Seccion = {
    href: string;
    icono: typeof MessageSquare;
    titulo: string;
    descripcion: string;
    contador?: number | null;
  };

  const secciones: Seccion[] = [
    {
      href: "/mensajes",
      icono: MessageSquare,
      titulo: "Mensajes",
      descripcion: "Tus conversaciones",
      contador: sinLeer > 0 ? sinLeer : null,
    },
    {
      href: "/actividad",
      icono: Activity,
      titulo: "Mi actividad",
      descripcion: "Publicaciones, propuestas y respuestas",
    },
    {
      href: "/mi-catalogo",
      icono: Package,
      titulo: "Mis productos y servicios",
      descripcion: "Administra tu catálogo",
    },
    {
      href: "/mi-perfil",
      icono: UserRound,
      titulo: "Mi perfil",
      descripcion: "Edita tu información",
    },
    {
      href: "/guardados",
      icono: Bookmark,
      titulo: "Guardados",
      descripcion: "Personas, negocios y publicaciones",
    },
    {
      href: "/agentes",
      icono: Bot,
      titulo: "Agentes IA",
      descripcion: "Configura tus agentes",
    },
    {
      href: "/asistente",
      icono: Sparkles,
      titulo: "Asistente",
      descripcion: "Pídele el siguiente paso",
    },
    {
      href: "/configuracion",
      icono: Settings,
      titulo: "Configuración",
      descripcion: "Cuenta y preferencias",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Encabezado
        titulo="Mi Conecta"
        bajada="Todo lo que necesitas para gestionar tu cuenta y tu actividad, en un solo lugar."
      />

      <Tarjeta className="flex items-center gap-3 p-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-marca/10 font-semibold text-marca">
          {perfil.nombre.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-texto">{perfil.nombre}</p>
          <p className="truncate text-xs text-tenue">
            {perfil.comunaNombre ?? "Sin comuna"}
            {perfil.roles.length ? ` · ${perfil.roles.join(", ")}` : ""}
          </p>
        </div>
      </Tarjeta>

      <Tarjeta className="divide-y divide-borde">
        {secciones.map(({ href, icono: Icono, titulo, descripcion, contador }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-superficie2"
          >
            <Icono size={18} className="shrink-0 text-tenue" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-texto">{titulo}</p>
              <p className="text-xs text-tenue">{descripcion}</p>
            </div>
            {contador ? <Insignia tono="marca">{contador}</Insignia> : null}
            <ChevronRight size={16} className="shrink-0 text-tenue" />
          </Link>
        ))}
      </Tarjeta>
    </div>
  );
}

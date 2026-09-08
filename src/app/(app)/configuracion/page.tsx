import type { Metadata } from "next";

import { accionSalir } from "@/app/acciones";
import { InterruptorDisponibilidad } from "@/components/interruptor-disponibilidad";
import { BotonEnlace, Boton, Encabezado, Tarjeta } from "@/components/ui";
import { obtenerSesion, puedeOfrecer, requerirPerfil } from "@/lib/sesion";

export const metadata: Metadata = { title: "Configuración" };
export const dynamic = "force-dynamic";

export default async function PaginaConfiguracion() {
  const perfil = await requerirPerfil("/configuracion");
  const sesion = await obtenerSesion();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Encabezado titulo="Configuración" bajada="Tu cuenta y tus preferencias." />

      <Tarjeta className="divide-y divide-borde">
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-texto">Correo de la cuenta</p>
            <p className="text-xs text-tenue">{sesion?.user?.email ?? "—"}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-texto">Información pública</p>
            <p className="text-xs text-tenue">Nombre, categorías, cobertura y contacto</p>
          </div>
          <BotonEnlace href="/mi-perfil" variante="secundario" tamano="sm">
            Editar
          </BotonEnlace>
        </div>

        {puedeOfrecer(perfil) ? (
          <div className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-medium text-texto">Disponibilidad</p>
              <p className="text-xs text-tenue">
                Se refleja de inmediato en el buscador, el mapa y tu ficha
              </p>
            </div>
            <InterruptorDisponibilidad disponible={perfil.disponibleAhora} />
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-texto">Sesión</p>
            <p className="text-xs text-tenue">Cerrar sesión en este dispositivo</p>
          </div>
          <form action={accionSalir}>
            <Boton type="submit" variante="peligro" tamano="sm">
              Salir
            </Boton>
          </form>
        </div>
      </Tarjeta>
    </div>
  );
}

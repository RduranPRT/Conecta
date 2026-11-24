import Link from "next/link";
import { Suspense } from "react";
import { MapPin } from "lucide-react";

import { accionSalir } from "@/app/acciones";
import { EnlacesIngreso } from "@/components/accion-con-sesion";
import { BuscadorEncabezado } from "@/components/buscador-rapido";
import { InterruptorDisponibilidad } from "@/components/interruptor-disponibilidad";
import { Avatar } from "@/components/ui";
import { obtenerPerfil, puedeOfrecer } from "@/lib/sesion";

export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-marca text-sm font-bold text-white">
        C
      </span>
      {!compacta ? (
        <span className="text-[15px] font-semibold tracking-tight text-texto">Conecta</span>
      ) : null}
    </Link>
  );
}

export async function EncabezadoApp() {
  const perfil = await obtenerPerfil();

  return (
    <header className="sticky top-0 z-40 border-b border-borde bg-superficie/85 backdrop-blur">
      <div className="contenedor flex h-14 items-center gap-3 sm:h-16">
        <Marca />

        <div className="mx-auto hidden w-full max-w-xl md:block">
          <Suspense fallback={<div className="h-10" />}>
            <BuscadorEncabezado />
          </Suspense>
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {perfil ? (
            <>
              {perfil.comunaNombre ? (
                <span className="hidden items-center gap-1 rounded-full border border-borde px-2.5 py-1 text-xs text-tenue lg:inline-flex">
                  <MapPin size={13} />
                  {perfil.comunaNombre}
                </span>
              ) : null}

              {puedeOfrecer(perfil) ? (
                <InterruptorDisponibilidad disponible={perfil.disponibleAhora} />
              ) : null}

              <Link href="/mi-perfil" className="ml-1">
                <Avatar nombre={perfil.nombre} url={perfil.avatarUrl} tamano={34} />
              </Link>

              <form action={accionSalir}>
                <button
                  type="submit"
                  className="hidden rounded-lg px-2 py-1 text-xs text-tenue transition hover:bg-superficie2 hover:text-texto sm:block"
                >
                  Salir
                </button>
              </form>
            </>
          ) : (
            <Suspense fallback={null}>
              <EnlacesIngreso />
            </Suspense>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        <BuscadorEncabezado className="contenedor pb-3 md:hidden" />
      </Suspense>
    </header>
  );
}

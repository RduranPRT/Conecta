import { EncabezadoApp } from "@/components/encabezado-app";
import { NavInferior, NavLateral } from "@/components/navegacion";
import { mensajesSinLeer } from "@/lib/casos/mensajes";
import { obtenerPerfil } from "@/lib/sesion";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const perfil = await obtenerPerfil();
  const sinLeer = perfil ? await mensajesSinLeer(perfil.id) : 0;

  return (
    <div className="min-h-dvh">
      <EncabezadoApp />

      <div className="contenedor flex gap-8 py-6 pb-24 lg:pb-10">
        <NavLateral sinLeer={sinLeer} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <NavInferior />
    </div>
  );
}

import type { Metadata } from "next";

import { TarjetaPublicacion } from "@/components/tarjeta-publicacion";
import { Encabezado, Vacio } from "@/components/ui";
import { guardadosDe } from "@/lib/casos/guardados";
import { requerirPerfil } from "@/lib/sesion";

export const metadata: Metadata = { title: "Guardados" };
export const dynamic = "force-dynamic";

export default async function PaginaGuardados() {
  const perfil = await requerirPerfil("/guardados");
  const items = await guardadosDe(perfil.id, 60);

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Guardados"
        bajada="Lo que marcaste para volver a verlo — publicaciones de tu territorio, en un solo lugar."
      />

      {items.length ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <TarjetaPublicacion
              key={item.publicacion.id}
              publicacion={item.publicacion}
              autorNombre={item.autorNombre}
              autorSlug={item.autorSlug}
              autorAvatar={item.autorAvatar}
              comunaNombre={item.comunaNombre}
              categoriaNombre={item.categoriaNombre}
              reacciones={Number(item.reacciones)}
              reaccionada={Boolean(item.reaccionada)}
              guardada
              patrocinado={false}
              motivo="Guardado por ti"
              hayPerfil
            />
          ))}
        </div>
      ) : (
        <Vacio
          titulo="No has guardado nada todavía"
          descripcion="Toca el ícono de marcador en cualquier publicación del feed para guardarla y encontrarla aquí después."
        />
      )}
    </div>
  );
}

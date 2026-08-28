import type { Metadata } from "next";

import { BotonEnlace, Encabezado, Insignia, Tarjeta } from "@/components/ui";
import { categoriasDisponibles, comunasActivas, perfilPublico } from "@/lib/casos/perfil";
import { requerirPerfil } from "@/lib/sesion";

import { FormularioEdicion } from "./formulario";

export const metadata: Metadata = { title: "Mi perfil" };
export const dynamic = "force-dynamic";

export default async function PaginaMiPerfil() {
  const sesion = await requerirPerfil("/mi-perfil");
  const [ficha, comunas, categorias] = await Promise.all([
    perfilPublico(sesion.slug),
    comunasActivas(),
    categoriasDisponibles(),
  ]);

  if (!ficha) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Encabezado
        titulo="Mi perfil"
        bajada="Así te ven en el buscador, en el mapa y en el feed."
        acciones={
          <BotonEnlace href={`/p/${ficha.slug}`} variante="secundario" tamano="sm">
            Ver ficha pública
          </BotonEnlace>
        }
      />

      <Tarjeta className="flex flex-wrap items-center gap-3 p-4">
        <Insignia tono={ficha.disponibleAhora ? "exito" : "contorno"}>
          {ficha.disponibleAhora ? "Disponible ahora" : "No disponible"}
        </Insignia>
        <Insignia tono="contorno">Plan {ficha.plan}</Insignia>
        <Insignia tono="contorno">
          {ficha.reputacionConteo} calificación(es)
        </Insignia>
        <Insignia tono="contorno">
          {ficha.operacionesCompletadas} operación(es) como proveedor
        </Insignia>
      </Tarjeta>

      <Tarjeta className="p-5 sm:p-6">
        <FormularioEdicion
          comunas={comunas}
          categorias={categorias}
          inicial={{
            nombre: ficha.nombre,
            descripcion: ficha.descripcion,
            rut: ficha.identificadorFiscal,
            telefono: ficha.telefono,
            direccion: ficha.direccion,
            comunaId: ficha.comunaId,
            radioKm: ficha.radioKm,
            roles: ficha.roles,
            categorias: ficha.categorias.map((c) => c.id),
            correoPublico: ficha.correoPublico,
            sitioWeb: ficha.sitioWeb,
          }}
          coberturaInicial={ficha.cobertura.map((c) => c.id)}
        />
      </Tarjeta>
    </div>
  );
}

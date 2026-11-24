import type { Metadata } from "next";

import { Encabezado, Tarjeta } from "@/components/ui";
import { opcionesCategoria } from "@/lib/casos/categorias";
import { requerirPerfil } from "@/lib/sesion";

import { FormularioItem } from "../formulario-item";

export const metadata: Metadata = { title: "Agregar al catálogo" };
export const dynamic = "force-dynamic";

export default async function PaginaNuevoItem({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const perfil = await requerirPerfil("/mi-catalogo/nuevo");
  const opciones = await opcionesCategoria();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Encabezado
        titulo="Agregar a mi catálogo"
        bajada="Lo que agregues aparece en tu ficha y hace que te encuentren por su nombre en el buscador."
      />
      <Tarjeta className="p-5 sm:p-6">
        <FormularioItem
          opciones={opciones}
          tipoPorDefecto={
            tipo === "servicio" || (!tipo && perfil.roles.includes("prestador"))
              ? "servicio"
              : "producto"
          }
        />
      </Tarjeta>
    </div>
  );
}

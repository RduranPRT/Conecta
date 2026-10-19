import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Encabezado, Tarjeta } from "@/components/ui";
import { itemDe } from "@/lib/casos/catalogo";
import { arbolDeRubros } from "@/lib/casos/categorias";
import { requerirPerfil } from "@/lib/sesion";

import { BotonDisponibilidadItem, FormularioItem } from "../formulario-item";

export const metadata: Metadata = { title: "Editar del catálogo" };
export const dynamic = "force-dynamic";

export default async function PaginaEditarItem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfil = await requerirPerfil(`/mi-catalogo/${id}`);
  const [item, rubros] = await Promise.all([itemDe(perfil.id, Number(id)), arbolDeRubros()]);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Encabezado
        titulo="Editar"
        bajada={item.activo ? "Visible en tu ficha y en el buscador." : "Retirado: hoy no se muestra."}
        acciones={<BotonDisponibilidadItem itemId={item.id} activo={item.activo} />}
      />
      <Tarjeta className="p-5 sm:p-6">
        <FormularioItem rubros={rubros} inicial={item} />
      </Tarjeta>
    </div>
  );
}

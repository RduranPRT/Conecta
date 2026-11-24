import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FotosItem } from "@/components/cargador-fotos";
import { Aviso, Encabezado, Tarjeta } from "@/components/ui";
import { itemDe } from "@/lib/casos/catalogo";
import { opcionesCategoria } from "@/lib/casos/categorias";
import { imagenesDeItem } from "@/lib/casos/imagenes";
import { MAXIMO_POR_ITEM } from "@/lib/imagenes";
import { requerirPerfil } from "@/lib/sesion";

import { BotonDisponibilidadItem, BotonEliminarItem, FormularioItem } from "../formulario-item";

export const metadata: Metadata = { title: "Editar del catálogo" };
export const dynamic = "force-dynamic";

export default async function PaginaEditarItem({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const [{ id }, { nuevo }] = await Promise.all([params, searchParams]);
  const perfil = await requerirPerfil(`/mi-catalogo/${id}`);
  const [item, opciones] = await Promise.all([itemDe(perfil.id, Number(id)), opcionesCategoria()]);
  if (!item) notFound();
  const fotos = await imagenesDeItem(item.id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Encabezado
        titulo="Editar"
        bajada={item.activo ? "Visible en tu ficha y en el buscador." : "Retirado: hoy no se muestra."}
        acciones={<BotonDisponibilidadItem itemId={item.id} activo={item.activo} />}
      />
      {nuevo ? (
        <Aviso tono="exito">
          Listo: «{item.nombre}» ya está en tu catálogo. Agrégale fotos para que llame la atención.
        </Aviso>
      ) : null}
      <Tarjeta className="p-5 sm:p-6">
        <FotosItem itemId={item.id} fotos={fotos} maximo={MAXIMO_POR_ITEM} />
      </Tarjeta>
      <Tarjeta className="p-5 sm:p-6">
        <FormularioItem opciones={opciones} inicial={item} />
      </Tarjeta>
      <BotonEliminarItem itemId={item.id} nombre={item.nombre} />
    </div>
  );
}

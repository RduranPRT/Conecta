import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RequiereDatos } from "@/components/requiere-datos";
import { Encabezado } from "@/components/ui";
import { datosParaRequisitos } from "@/lib/casos/perfil";
import { esAccion, requisitosPara, type AccionConRequisitos } from "@/lib/casos/requisitos";
import { destinoSeguro } from "@/lib/destino";
import { requerirPerfil } from "@/lib/sesion";

export const metadata: Metadata = { title: "Completa tus datos" };
export const dynamic = "force-dynamic";

const TITULO: Partial<Record<AccionConRequisitos, string>> = {
  ofrecer: "Para que te encuentren",
  contactar: "Completa tu cuenta",
};

/** Pide lo que falta para una acción y vuelve a donde se estaba. */
export default async function PaginaCompletar({
  searchParams,
}: {
  searchParams: Promise<{ accion?: string; next?: string }>;
}) {
  const { accion = "", next } = await searchParams;
  const retorno = destinoSeguro(next);
  const elegida: AccionConRequisitos = esAccion(accion) ? accion : "ofrecer";
  const consulta = new URLSearchParams({ accion: elegida, next: retorno });
  const perfil = await requerirPerfil(`/completar?${consulta}`);

  if (!requisitosPara(elegida, await datosParaRequisitos(perfil.id)).length) redirect(retorno);

  return (
    <div className="mx-auto max-w-xl">
      <Encabezado
        titulo={elegida === "ofrecer" ? "Activa lo que ofreces" : "Completa tus datos"}
        bajada={
          elegida === "ofrecer"
            ? "Es la misma cuenta: sigues pudiendo buscar y contratar."
            : "Lo pedimos una sola vez."
        }
      />
      <RequiereDatos
        accion={elegida}
        perfilId={perfil.id}
        next={retorno}
        titulo={TITULO[elegida] ?? "Antes de continuar"}
        boton={elegida === "ofrecer" ? "Guardar y aparecer en Conecta" : undefined}
      />
    </div>
  );
}

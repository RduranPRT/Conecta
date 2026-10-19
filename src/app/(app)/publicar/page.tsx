import type { Metadata } from "next";
import Link from "next/link";

import { Aviso, BotonEnlace, Encabezado, Tarjeta } from "@/components/ui";
import { arbolDeRubros } from "@/lib/casos/categorias";
import { datosParaRequisitos } from "@/lib/casos/perfil";
import { faltantesPara } from "@/lib/casos/requisitos";
import { opcionesTerritorio } from "@/lib/casos/territorio";
import { requerirPerfil } from "@/lib/sesion";

import { FormularioNecesidad, FormularioPublicacion } from "./formularios";

export const metadata: Metadata = { title: "Publicar" };
export const dynamic = "force-dynamic";

export default async function PaginaPublicar({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string }>;
}) {
  const { q = "", tipo = "necesidad" } = await searchParams;
  const perfil = await requerirPerfil("/publicar");

  const [territorio, rubros, datos] = await Promise.all([
    opcionesTerritorio(),
    arbolDeRubros(),
    datosParaRequisitos(perfil.id),
  ]);
  const esNecesidad = tipo === "necesidad";
  // S05: si falta algo para ofrecer, se dice antes de llenar el formulario.
  const faltanParaOfrecer = faltantesPara("publicar_oferta", datos).filter(
    (f) => f.campo !== "comunaId",
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Encabezado
        titulo="Publicar"
        bajada="Publica lo que necesitas o lo que ofreces. Ambas cosas llegan al feed de tu territorio; una necesidad además dispara el match automático."
      />

      <nav className="inline-flex rounded-xl border border-borde bg-superficie p-1">
        <Link
          href={`/publicar?tipo=necesidad${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          className={
            esNecesidad
              ? "rounded-lg bg-marca px-4 py-2 text-xs font-medium text-white"
              : "rounded-lg px-4 py-2 text-xs text-tenue transition hover:bg-superficie2"
          }
        >
          Necesito algo
        </Link>
        <Link
          href="/publicar?tipo=oferta"
          className={
            !esNecesidad
              ? "rounded-lg bg-marca px-4 py-2 text-xs font-medium text-white"
              : "rounded-lg px-4 py-2 text-xs text-tenue transition hover:bg-superficie2"
          }
        >
          Ofrezco algo
        </Link>
      </nav>

      {!esNecesidad && faltanParaOfrecer.length ? (
        <Aviso tono="alerta">
          <p className="font-medium">Antes de ofrecer algo, cuéntanos qué ofreces.</p>
          <p className="mt-1">{faltanParaOfrecer[0].motivo} Es la misma cuenta: solo activas una opción más.</p>
          <BotonEnlace href="/mi-perfil" tamano="sm" className="mt-3">
            Completar en Mi perfil
          </BotonEnlace>
        </Aviso>
      ) : null}

      <Tarjeta className="p-5 sm:p-6">
        {esNecesidad ? (
          <FormularioNecesidad
            territorio={territorio}
            rubros={rubros}
            comunaPorDefecto={perfil.comunaId}
            textoInicial={q}
          />
        ) : (
          <FormularioPublicacion
            territorio={territorio}
            rubros={rubros}
            comunaPorDefecto={perfil.comunaId}
            tipoInicial={tipo === "necesidad" ? "oferta" : tipo}
          />
        )}
      </Tarjeta>

      <p className="text-xs text-tenue">
        {esNecesidad
          ? "Al publicar, la plataforma interpreta el texto, deduce categoría y urgencia, y avisa automáticamente a los actores compatibles más cercanos."
          : "Las publicaciones se ordenan en el feed por cercanía, rubro y novedad. La visibilidad se puede promocionar; la reputación no."}
      </p>
    </div>
  );
}

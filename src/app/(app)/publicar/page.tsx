import type { Metadata } from "next";
import Link from "next/link";

import { RequiereDatos } from "@/components/requiere-datos";
import { Encabezado, Tarjeta } from "@/components/ui";
import { opcionesCategoria } from "@/lib/casos/categorias";
import { opcionesTerritorio } from "@/lib/casos/territorio";
import { requerirPerfil } from "@/lib/sesion";

import { FormularioNecesidad, FormularioPublicacion } from "./formularios";

export const metadata: Metadata = { title: "Publicar" };
export const dynamic = "force-dynamic";

export default async function PaginaPublicar({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; para?: string }>;
}) {
  const { q = "", tipo = "necesidad", para = "" } = await searchParams;
  const consulta = new URLSearchParams({ tipo, ...(q ? { q } : {}), ...(para ? { para } : {}) });
  const perfil = await requerirPerfil(`/publicar?${consulta}`);

  const [territorio, opciones] = await Promise.all([
    opcionesTerritorio(),
    opcionesCategoria(),
  ]);
  const esNecesidad = tipo === "necesidad";

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

      <RequiereDatos
        accion={esNecesidad ? "publicar_necesidad" : "publicar_oferta"}
        perfilId={perfil.id}
        next={`/publicar?${consulta}`}
        titulo={esNecesidad ? "Antes de publicar" : "Antes de ofrecer algo"}
        yaLoPide={esNecesidad ? ["comunaId"] : []}
      >
      <Tarjeta className="p-5 sm:p-6">
        {esNecesidad ? (
          <FormularioNecesidad
            territorio={territorio}
            opciones={opciones}
            comunaPorDefecto={perfil.comunaId}
            textoInicial={q}
          />
        ) : (
          <FormularioPublicacion
            territorio={territorio}
            opciones={opciones}
            comunaPorDefecto={perfil.comunaId}
            tipoInicial={tipo === "necesidad" ? "oferta" : tipo}
          />
        )}
      </Tarjeta>
      </RequiereDatos>

      <p className="text-xs text-tenue">
        {esNecesidad
          ? "Al publicar, la plataforma interpreta el texto, deduce categoría y urgencia, y avisa automáticamente a los actores compatibles más cercanos."
          : "Las publicaciones se ordenan en el feed por cercanía, rubro y novedad. La visibilidad se puede promocionar; la reputación no."}
      </p>
    </div>
  );
}

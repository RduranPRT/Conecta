import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";

import { AccionConSesion } from "@/components/accion-con-sesion";
import { EtiquetaSentido } from "@/components/etiqueta-sentido";
import { Mapa, type PuntoMapa } from "@/components/mapa";
import { TarjetaActor } from "@/components/tarjeta-actor";
import { IndicadorTerritorio } from "@/components/territorio-explorado";
import { Aviso, BotonEnlace, Insignia, Tarjeta, Vacio } from "@/components/ui";
import type { RolActor } from "@/db/schema";
import { buscarEnTerritorio } from "@/lib/casos/buscar";
import { registrarBusqueda } from "@/lib/casos/busquedas";
import { buscarNecesidadesAbiertas } from "@/lib/casos/necesidades";
import { buscables } from "@/lib/casos/categorias";
import { categoriasPorId } from "@/lib/casos/perfil";
import { opcionesTerritorio, ubicacionDeComuna } from "@/lib/casos/territorio";
import { formatearDistancia } from "@/lib/geo";
import { contextoInterprete, hayModelo, interpretar } from "@/lib/ia";
import { ROLES_QUE_OFRECEN } from "@/lib/roles";
import { obtenerPerfil } from "@/lib/sesion";
import { sugerirCategorias } from "@/lib/taxonomia";
import { territorioDeLaPeticion } from "@/lib/territorio-sesion";

export const metadata: Metadata = { title: "Buscar" };
export const dynamic = "force-dynamic";

type Params = Promise<{
  q?: string;
  vista?: string;
  comuna?: string;
  categoria?: string;
  rol?: string;
}>;

const VISTAS = [
  { valor: "lista", etiqueta: "Lista" },
  { valor: "mapa", etiqueta: "Mapa" },
  { valor: "mixta", etiqueta: "Ambos" },
] as const;

/** Filtros por tipo de actor (P04): servicio, comercio, proveedor, productor. */
const FILTROS_ROL: { valor: RolActor | "todos"; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todo" },
  { valor: "prestador", etiqueta: "Servicios" },
  { valor: "negocio", etiqueta: "Comercios" },
  { valor: "proveedor", etiqueta: "Proveedores" },
  { valor: "productor", etiqueta: "Productores" },
];

const PILDORA =
  "shrink-0 rounded-full border border-borde bg-superficie px-3 py-1.5 text-xs text-tenue transition hover:bg-superficie2";
const PILDORA_ACTIVA =
  "shrink-0 rounded-full bg-marca px-3 py-1.5 text-xs font-medium text-white";

export default async function PaginaBuscar({ searchParams }: { searchParams: Params }) {
  const { q = "", vista = "lista", comuna, categoria, rol = "todos" } = await searchParams;
  const [perfil, explorado] = await Promise.all([obtenerPerfil(), territorioDeLaPeticion(comuna)]);
  const conSesion = Boolean(perfil);

  const contexto = await contextoInterprete(
    explorado.explicito ? (explorado.comuna?.id ?? null) : (perfil?.comunaId ?? null),
  );
  const intencion = await interpretar(q, contexto);
  if (Number(categoria)) {
    intencion.categoriaId = Number(categoria);
    const [cat] = await categoriasPorId([Number(categoria)]);
    intencion.categoriaNombre = cat?.nombre ?? intencion.categoriaNombre;
  }

  const filtraRol = (ROLES_QUE_OFRECEN as string[]).includes(rol);
  const hayCriterio = Boolean(q || intencion.categoriaId || Number(comuna) || filtraRol);
  const desdePerfil = perfil?.lat && perfil?.lng ? { lat: perfil.lat, lng: perfil.lng } : null;

  const [resultado, necesidadesRelacionadas, territorio, nombrada] = await Promise.all([
    hayCriterio
      ? buscarEnTerritorio({ intencion, explorado, rol, desdePerfil, conSesion })
      : { actores: [], fueraDeTerritorio: false, roles: ROLES_QUE_OFRECEN },
    q || intencion.categoriaId ? buscarNecesidadesAbiertas(intencion, { conSesion }) : [],
    opcionesTerritorio(),
    ubicacionDeComuna(intencion.comunaId),
  ]);
  const { actores } = resultado;
  // Si la frase nombra una comuna, esa es la que se está explorando.
  const aqui = nombrada ?? explorado.comuna;

  if (q) {
    await registrarBusqueda({
      perfilId: perfil?.id ?? null,
      intencion,
      resultados: resultado.fueraDeTerritorio ? 0 : actores.length,
    });
  }

  const puntos: PuntoMapa[] = actores
    .filter((a) => a.lat !== null && a.lng !== null)
    .map((a) => ({
      id: a.id,
      nombre: a.nombre,
      slug: a.slug,
      lat: a.lat!,
      lng: a.lng!,
      rol: a.roles[0] ?? "persona",
      comuna: a.comunaNombre,
      categoria: a.categorias[0]?.nombre ?? null,
      disponible: a.disponibleAhora,
      reputacion: a.reputacionPromedio,
      distancia: a.distanciaKm !== null ? formatearDistancia(a.distanciaKm) : null,
    }));
  const centro = aqui ? { lat: aqui.lat, lng: aqui.lng } : { lat: -33.45, lng: -70.66 };

  const enlace = (cambios: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base = { q: q || undefined, comuna, categoria, rol, vista, ...cambios };
    for (const [clave, valor] of Object.entries(base)) {
      if (valor && valor !== "todos" && !(clave === "vista" && valor === "lista")) p.set(clave, valor);
    }
    return `/buscar?${p.toString()}`;
  };

  // «No hay oferta» y «no existe» no son lo mismo (S12).
  const sugerencias =
    q && !actores.length && !intencion.categoriaId
      ? sugerirCategorias(q, await buscables())
      : [];
  const donde = aqui && (explorado.explicito || nombrada) ? `en ${aqui.nombre}` : "en Chile";
  const vacio = !hayCriterio
    ? {
        titulo: "Escribe qué necesitas",
        descripcion:
          "Una palabra («gasfíter») o una frase completa («necesito un gasfíter que pueda venir hoy cerca de mí»).",
      }
    : intencion.categoriaNombre
      ? {
          titulo: `«${intencion.categoriaNombre}» sí existe en Conecta, pero todavía nadie lo ofrece ${donde}`,
          descripcion:
            "Publícalo como necesidad: avisamos a quien pueda resolverlo apenas aparezca.",
        }
      : {
          titulo: "No reconocemos esa búsqueda",
          descripcion: sugerencias.length
            ? "Prueba con una de estas opciones, escríbelo de otra forma o publícalo como necesidad."
            : "Escríbelo de otra forma, explora por área o publícalo como necesidad con tus palabras.",
        };

  const titulo = q ? `«${q}»` : (intencion.categoriaNombre ?? "Buscar");

  return (
    <div className="space-y-2.5">
      {/* Compacto a propósito (S06): la primera tarjeta se ve sin hacer scroll. */}
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="truncate text-base font-semibold text-texto">{titulo}</h1>
        {hayCriterio ? (
          <p className="shrink-0 text-xs text-tenue">
            {actores.length} {actores.length === 1 ? "resultado" : "resultados"}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <IndicadorTerritorio
          explorado={{ comuna: aqui, explicito: explorado.explicito }}
          territorio={territorio}
          volver={enlace({ comuna: undefined })}
        />
        {intencion.categoriaNombre && q ? (
          <Link
            href={enlace({ categoria: undefined })}
            className="inline-flex items-center gap-1 rounded-full bg-marca/10 px-2.5 py-1 text-marca"
            title={intencion.explicacion}
          >
            <Sparkles size={11} />
            {intencion.categoriaNombre}
            {categoria ? <X size={11} /> : null}
          </Link>
        ) : null}
        {intencion.disponibilidad !== "cualquiera" ? (
          <Insignia tono="alerta">
            {intencion.disponibilidad === "hoy" ? "Hoy" : "Esta semana"}
          </Insignia>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <div className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1">
          {FILTROS_ROL.map((f) => (
            <Link
              key={f.valor}
              href={enlace({ rol: f.valor })}
              className={(filtraRol ? rol : "todos") === f.valor ? PILDORA_ACTIVA : PILDORA}
            >
              {f.etiqueta}
            </Link>
          ))}
          <Link
            href={enlace({ vista: vista === "mapa" ? "lista" : "mapa" })}
            className={`${vista === "mapa" ? PILDORA_ACTIVA : PILDORA} sm:hidden`}
          >
            {vista === "mapa" ? "Ver lista" : "Ver mapa"}
          </Link>
        </div>
        <nav className="hidden shrink-0 rounded-xl border border-borde bg-superficie p-0.5 sm:inline-flex">
          {VISTAS.map((v) => (
            <Link
              key={v.valor}
              href={enlace({ vista: v.valor })}
              className={
                vista === v.valor
                  ? "rounded-lg bg-marca px-2.5 py-1 text-xs font-medium text-white"
                  : "rounded-lg px-2.5 py-1 text-xs text-tenue transition hover:bg-superficie2"
              }
            >
              {v.etiqueta}
            </Link>
          ))}
        </nav>
      </div>

      {resultado.fueraDeTerritorio && aqui ? (
        <Aviso tono="alerta">
          Todavía no hay oferta en {aqui.nombre}. Estos son los más cercanos en otras comunas.
        </Aviso>
      ) : null}

      {vista !== "lista" && puntos.length ? (
        <Mapa puntos={puntos} centro={centro} alto={vista === "mapa" ? "70vh" : "42vh"} />
      ) : null}

      {vista !== "mapa" ? (
        actores.length ? (
          <div className="grid grid-cols-1 gap-3" data-testid="resultados">
            {actores.map((actor) => (
              <TarjetaActor key={actor.id} actor={actor} />
            ))}
          </div>
        ) : (
          <Vacio titulo={vacio.titulo} descripcion={vacio.descripcion}>
            {sugerencias.length ? (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-xs text-tenue">¿Quisiste decir?</span>
                {sugerencias.map((s) => (
                  <Link key={s.id} href={`/buscar?categoria=${s.id}`}>
                    <Insignia tono="marca">{s.nombre}</Insignia>
                  </Link>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap justify-center gap-2">
              {hayCriterio ? (
                <AccionConSesion
                  href={`/publicar?tipo=necesidad&q=${encodeURIComponent(q || intencion.categoriaNombre || "")}`}
                  haySesion={conSesion}
                  tamano="sm"
                >
                  Publicar como necesidad
                </AccionConSesion>
              ) : null}
              <BotonEnlace href="/explorar" variante="secundario" tamano="sm">
                Explorar por área
              </BotonEnlace>
            </div>
          </Vacio>
        )
      ) : null}

      {hayCriterio && !hayModelo() && actores.length ? (
        <p className="text-center text-[11px] text-tenue">
          Ordenado por distancia, relevancia, disponibilidad y reputación.
        </p>
      ) : null}

      {necesidadesRelacionadas.length ? (
        <section className="pt-4">
          <h2 className="titulo-seccion mb-3">Pedidos abiertos relacionados</h2>
          <Tarjeta className="divide-y divide-borde">
            {necesidadesRelacionadas.map((necesidad) => (
              <Link
                key={necesidad.id}
                href={`/necesidades/${necesidad.id}`}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-superficie2"
              >
                <EtiquetaSentido tipo="necesidad" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-texto">{necesidad.titulo}</span>
                  <span className="mt-0.5 block text-xs text-tenue">
                    {necesidad.solicitanteNombre} · {necesidad.comunaNombre ?? "sin comuna"}
                  </span>
                </span>
              </Link>
            ))}
          </Tarjeta>
        </section>
      ) : null}
    </div>
  );
}

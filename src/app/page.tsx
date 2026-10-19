import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Megaphone, Search, ShieldCheck, Store } from "lucide-react";

import { BuscadorRapido } from "@/components/buscador-rapido";
import { Marca } from "@/components/encabezado-app";
import { BotonEnlace, Insignia } from "@/components/ui";
import { pulsoTerritorial } from "@/lib/casos/actividad";
import { arbolDeRubros } from "@/lib/casos/categorias";
import { comunaPiloto, comunasConActividad } from "@/lib/casos/territorio";
import { obtenerPerfil } from "@/lib/sesion";

export const dynamic = "force-dynamic";

/**
 * Qué se puede hacer, con ejemplos de la vida diaria (S01). Lo pidieron
 * quienes probaron la plataforma sin que nadie se la explicara.
 */
const COMO_FUNCIONA = [
  {
    icono: Search,
    titulo: "Busca lo que necesitas",
    ejemplo: "«Un gásfiter que pueda venir hoy» o «repuestos para mi auto en Maipú».",
    texto: "Escríbelo como lo dirías. Te mostramos quién lo ofrece cerca.",
  },
  {
    icono: Megaphone,
    titulo: "O pídelo y deja que te ofrezcan",
    ejemplo: "«Necesito 20 sacos de harina para el jueves».",
    texto: "Publícalo una vez y avisamos a quienes pueden resolverlo para que te coticen.",
  },
  {
    icono: Store,
    titulo: "Ofrece lo que haces o vendes",
    ejemplo: "¿Vendes pan amasado, reparas lavadoras o eres abogado?",
    texto: "Crea tu perfil gratis y aparece cuando alguien de tu zona lo busque.",
  },
];

export default async function Portada() {
  const perfil = await obtenerPerfil();
  if (perfil) redirect("/inicio");

  const [piloto, pulso, rubros, conActividad] = await Promise.all([
    comunaPiloto(),
    pulsoTerritorial(null),
    arbolDeRubros(),
    comunasConActividad(),
  ]);

  return (
    <div className="min-h-dvh">
      <header className="border-b border-borde bg-superficie/80 backdrop-blur">
        <div className="contenedor flex h-16 items-center justify-between">
          <Marca />
          <div className="flex items-center gap-2">
            <BotonEnlace href="/ingresar" variante="fantasma" tamano="sm">
              Ingresar
            </BotonEnlace>
            <BotonEnlace href="/registro" tamano="sm">
              Crear cuenta
            </BotonEnlace>
          </div>
        </div>
      </header>

      <section className="contenedor pb-10 pt-8 sm:pb-14 sm:pt-14">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm text-tenue">
            Vecinos, técnicos, profesionales, negocios y proveedores de tu comuna, en un solo
            lugar.
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-texto sm:text-5xl">
            ¿Qué necesitas?
          </h1>

          <div className="mt-5">
            <Suspense fallback={<div className="h-14" />}>
              <BuscadorRapido tamano="lg" />
            </Suspense>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <BotonEnlace href="/explorar" variante="secundario">
              Explorar sin cuenta
            </BotonEnlace>
            <BotonEnlace href="/mapa" variante="fantasma">
              Ver el mapa
            </BotonEnlace>
          </div>

          {piloto ? (
            <p className="mt-5 text-xs text-tenue">
              <Insignia tono="marca">Piloto · {piloto.nombre}</Insignia>{" "}
              Funciona en todo Chile; donde recién empezamos puede haber poca oferta todavía.
            </p>
          ) : null}
        </div>
      </section>

      <section className="border-y border-borde bg-superficie">
        <div className="contenedor py-10 sm:py-14">
          <h2 className="text-center text-xl font-semibold text-texto">Cómo funciona</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {COMO_FUNCIONA.map(({ icono: Icono, titulo, ejemplo, texto }) => (
              <div key={titulo} className="tarjeta p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-marca/10 text-marca">
                  <Icono size={19} />
                </span>
                <h3 className="mt-3 text-[15px] font-semibold text-texto">{titulo}</h3>
                <p className="mt-1.5 text-sm italic text-texto">{ejemplo}</p>
                <p className="mt-1.5 text-sm text-tenue">{texto}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-6 flex max-w-xl items-start justify-center gap-2 text-center text-xs text-tenue">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-marca" />
            La reputación se gana con trabajos reales y no se puede comprar. Lo patrocinado
            siempre va marcado.
          </p>
        </div>
      </section>

      <section className="contenedor py-10 sm:py-14">
        <h2 className="text-center text-xl font-semibold text-texto">¿Qué estás buscando?</h2>
        <p className="mt-1 text-center text-sm text-tenue">
          Si no sabes cómo se llama, empieza por el área.
        </p>
        <div className="mx-auto mt-6 grid max-w-4xl grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {rubros.map((r) => (
            <Link
              key={r.id}
              href={`/explorar/${r.slug}`}
              className="flex items-center gap-2 rounded-xl border border-borde bg-superficie px-3 py-2.5 text-sm text-texto transition hover:bg-superficie2"
            >
              <span aria-hidden>{r.icono}</span>
              <span className="min-w-0 truncate">{r.nombre}</span>
            </Link>
          ))}
        </div>

        <dl className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { valor: pulso.actores, etiqueta: "perfiles en la red" },
            { valor: pulso.necesidadesAbiertas, etiqueta: "pedidos abiertos" },
            { valor: pulso.operacionesCerradas, etiqueta: "trabajos concretados" },
            { valor: conActividad, etiqueta: "comunas con oferta" },
          ].map((m) => (
            <div key={m.etiqueta} className="tarjeta px-4 py-4 text-center">
              <dt className="text-2xl font-semibold text-texto">{m.valor}</dt>
              <dd className="mt-1 text-xs text-tenue">{m.etiqueta}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="contenedor pb-14">
        <div className="tarjeta flex flex-col items-center gap-3 px-6 py-10 text-center">
          <h2 className="text-xl font-semibold text-texto">Crear tu cuenta es gratis</h2>
          <p className="max-w-xl text-sm text-tenue">
            Una sola cuenta para buscar y, si quieres, ofrecer. Te pedimos lo mínimo: el resto lo
            completas cuando lo necesites.
          </p>
          <BotonEnlace href="/registro" tamano="lg">
            Crear mi cuenta
          </BotonEnlace>
        </div>
      </section>

      <footer className="border-t border-borde py-8">
        <div className="contenedor flex flex-col items-center justify-between gap-3 text-xs text-tenue sm:flex-row">
          <p>Conecta · prototipo funcional · {new Date().getFullYear()}</p>
          <div className="flex gap-4">
            <Link href="/explorar" className="hover:text-texto">
              Explorar
            </Link>
            <Link href="/buscar" className="hover:text-texto">
              Buscar
            </Link>
            <Link href="/mapa" className="hover:text-texto">
              Mapa
            </Link>
            <Link href="/descubrir" className="hover:text-texto">
              Publicaciones
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

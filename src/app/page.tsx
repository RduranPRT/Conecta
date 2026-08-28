import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Bot, Compass, Handshake, Map, Search, ShieldCheck } from "lucide-react";

import { BuscadorRapido } from "@/components/buscador-rapido";
import { Marca } from "@/components/encabezado-app";
import { BotonEnlace, Insignia } from "@/components/ui";
import { pulsoTerritorial } from "@/lib/casos/actividad";
import { comunasActivas } from "@/lib/casos/perfil";
import { obtenerPerfil } from "@/lib/sesion";

export const dynamic = "force-dynamic";

const PILARES = [
  {
    icono: Search,
    titulo: "El buscador encuentra",
    texto:
      "Una sola caja para personas, prestadores, negocios, proveedores y productos. Escribe como hablas: «un gasfíter que pueda venir hoy cerca de mí».",
  },
  {
    icono: Map,
    titulo: "El mapa descubre",
    texto:
      "Explora tu comuna sin buscar nada. Iconografía distinta por tipo de actor y ficha resumida al tocar cada punto.",
  },
  {
    icono: Compass,
    titulo: "El feed conecta",
    texto:
      "Productos, servicios, ofertas y necesidades de tu territorio. Cada publicación termina en una acción, no en un scroll.",
  },
  {
    icono: Handshake,
    titulo: "Las operaciones concretan",
    texto:
      "Necesidad → propuestas → comparación → adjudicación → entrega → calificación mutua, con la traza completa.",
  },
  {
    icono: Bot,
    titulo: "La IA coordina",
    texto:
      "Interpreta lo que pides, convierte necesidades en oportunidades y ordena los resultados. La autonomía la fija el usuario.",
  },
  {
    icono: ShieldCheck,
    titulo: "La confianza no se compra",
    texto:
      "Verificación y reputación se ganan con operaciones reales. Pagar aumenta visibilidad y capacidades, nunca confianza.",
  },
];

export default async function Portada() {
  const perfil = await obtenerPerfil();
  if (perfil) redirect("/inicio");

  const comunas = await comunasActivas();
  const piloto = comunas.find((c) => c.activa) ?? comunas[0] ?? null;
  const pulso = await pulsoTerritorial(piloto?.id ?? null);

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

      <section className="contenedor py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          {piloto ? (
            <Insignia tono="marca">Comuna piloto · {piloto.nombre}</Insignia>
          ) : null}
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-texto sm:text-5xl">
            Todo lo que tu territorio ofrece, en un solo lugar
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-tenue sm:text-lg">
            Conecta personas, prestadores de servicios, negocios, proveedores y productores.
            Busca lo que necesitas, descubre lo que existe alrededor y cierra la operación
            sin salir de la plataforma.
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <Suspense fallback={<div className="h-14" />}>
              <BuscadorRapido tamano="lg" />
            </Suspense>
            <p className="mt-3 text-xs text-tenue">
              Prueba con una frase completa. La plataforma interpreta la intención y arma
              los filtros por ti.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <BotonEnlace href="/mapa" variante="secundario">
              Explorar el mapa
            </BotonEnlace>
            <BotonEnlace href="/descubrir" variante="secundario">
              Ver el feed
            </BotonEnlace>
          </div>
        </div>

        <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { valor: pulso.actores, etiqueta: "actores en la red" },
            { valor: pulso.necesidadesAbiertas, etiqueta: "necesidades abiertas" },
            { valor: pulso.operacionesCerradas, etiqueta: "operaciones concretadas" },
            { valor: comunas.length, etiqueta: "comunas habilitadas" },
          ].map((m) => (
            <div key={m.etiqueta} className="tarjeta px-4 py-5 text-center">
              <dt className="text-2xl font-semibold text-texto">{m.valor}</dt>
              <dd className="mt-1 text-xs text-tenue">{m.etiqueta}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-borde bg-superficie">
        <div className="contenedor py-14 sm:py-20">
          <h2 className="text-center text-xl font-semibold text-texto sm:text-2xl">
            Cinco formas de navegar, una sola base de información
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-tenue">
            El buscador, el mapa, el feed, las operaciones y la IA no son sistemas separados:
            leen y escriben sobre los mismos datos y estados.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILARES.map(({ icono: Icono, titulo, texto }) => (
              <div key={titulo} className="tarjeta p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-marca/10 text-marca">
                  <Icono size={19} />
                </span>
                <h3 className="mt-3.5 text-[15px] font-semibold text-texto">{titulo}</h3>
                <p className="mt-1.5 text-sm text-tenue">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="contenedor py-14 sm:py-20">
        <div className="tarjeta flex flex-col items-center gap-4 px-6 py-12 text-center">
          <h2 className="text-xl font-semibold text-texto sm:text-2xl">
            Crear tu perfil es gratis y toma dos minutos
          </h2>
          <p className="max-w-xl text-sm text-tenue">
            Aparecer en el buscador y en el mapa, publicar, contactar, recibir reseñas y
            recibir oportunidades básicas no cuesta nada. Una identidad, todos los roles
            que necesites.
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
            <Link href="/buscar" className="hover:text-texto">
              Buscar
            </Link>
            <Link href="/mapa" className="hover:text-texto">
              Mapa
            </Link>
            <Link href="/descubrir" className="hover:text-texto">
              Descubrir
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

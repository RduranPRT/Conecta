"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Crosshair, MapPin, Star, X } from "lucide-react";
import "leaflet/dist/leaflet.css";

import { Avatar } from "@/components/ui";

export type PuntoMapa = {
  id: number;
  nombre: string;
  slug: string;
  lat: number;
  lng: number;
  rol: string;
  comuna: string | null;
  categoria: string | null;
  disponible: boolean;
  reputacion: string | null;
  reputacionConteo?: number;
  avatarUrl?: string | null;
  distancia: string | null;
};

/** Iconografía diferenciada por categoría de actor, como pide el prompt. */
const ESTILO_ROL: Record<string, { emoji: string; color: string }> = {
  prestador: { emoji: "🔧", color: "#0f766e" },
  negocio: { emoji: "🏪", color: "#1d4ed8" },
  proveedor: { emoji: "📦", color: "#7c3aed" },
  productor: { emoji: "🌾", color: "#b45309" },
  persona: { emoji: "👤", color: "#475569" },
};

export function Mapa({
  puntos,
  centro,
  miUbicacion,
  zoom = 13,
  alto = "70vh",
  fichaInferior = false,
}: {
  puntos: PuntoMapa[];
  centro: { lat: number; lng: number };
  /** Posición real del visitante (geolocalización), si la compartió. */
  miUbicacion?: { lat: number; lng: number } | null;
  zoom?: number;
  alto?: string;
  /** Al tocar un punto muestra una ficha resumida sobre el borde inferior del
   * mapa, en vez del globo de Leaflet, y agrega el botón «Mi ubicación».
   * Viene de la propuesta de UX simplificada de Álvaro (sep-2026). */
  fichaInferior?: boolean;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<unknown>(null);
  const [seleccionado, setSeleccionado] = useState<PuntoMapa | null>(null);
  const [ubicando, setUbicando] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const parametros = useSearchParams();

  /** Si ya conocemos la ubicación, centra el mapa en ella; si no, la pide al
   * navegador y la agrega a la URL para que la pantalla recalcule cercanía. */
  function irAMiUbicacion() {
    const mapa = mapaRef.current as { setView: (c: [number, number], z: number) => void } | null;
    if (miUbicacion && mapa) {
      mapa.setView([miUbicacion.lat, miUbicacion.lng], 15);
      return;
    }
    if (!("geolocation" in navigator)) return;
    setUbicando(true);
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const p = new URLSearchParams(parametros.toString());
        p.delete("comuna");
        p.set("lat", posicion.coords.latitude.toFixed(6));
        p.set("lng", posicion.coords.longitude.toFixed(6));
        router.replace(`${pathname}?${p.toString()}`);
        setUbicando(false);
      },
      () => setUbicando(false),
      { enableHighAccuracy: true, timeout: 8_000 },
    );
  }

  useEffect(() => {
    let activo = true;
    setSeleccionado(null);

    async function montar() {
      const L = (await import("leaflet")).default;
      if (!activo || !contenedor.current) return;

      // Evita re-inicializar el mismo nodo durante los refrescos de desarrollo.
      if (mapaRef.current) {
        (mapaRef.current as { remove: () => void }).remove();
        mapaRef.current = null;
      }

      const mapa = L.map(contenedor.current, {
        center: [centro.lat, centro.lng],
        zoom,
        scrollWheelZoom: true,
        attributionControl: true,
      });
      mapaRef.current = mapa;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(mapa);

      const grupo: [number, number][] = [];

      if (miUbicacion) {
        const iconoUbicacion = L.divIcon({
          className: "",
          html: '<div class="marcador-mi-ubicacion"><span></span></div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        L.marker([miUbicacion.lat, miUbicacion.lng], {
          icon: iconoUbicacion,
          zIndexOffset: 1000,
        })
          .addTo(mapa)
          .bindPopup("Estás aquí");
        grupo.push([miUbicacion.lat, miUbicacion.lng]);
      }

      for (const punto of puntos) {
        const estilo = ESTILO_ROL[punto.rol] ?? ESTILO_ROL.persona;
        const icono = L.divIcon({
          className: "",
          html:
            `<div class="marcador-conecta" style="background:${estilo.color}">` +
            `<span>${estilo.emoji}</span></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 30],
          popupAnchor: [0, -28],
        });

        const marcador = L.marker([punto.lat, punto.lng], { icon: icono }).addTo(mapa);
        grupo.push([punto.lat, punto.lng]);

        if (fichaInferior) {
          marcador.on("click", () => setSeleccionado(punto));
          continue;
        }

        const detalles = [
          punto.categoria,
          punto.comuna,
          punto.distancia,
          punto.disponible ? "Disponible ahora" : null,
          punto.reputacion ? `${punto.reputacion} ★` : null,
        ]
          .filter(Boolean)
          .join(" · ");

        marcador.bindPopup(
          `<strong style="font-size:14px">${punto.nombre}</strong>` +
            `<br><span style="opacity:.7;font-size:12px">${detalles}</span>` +
            `<br><a href="/p/${punto.slug}" style="color:#0f766e;font-weight:500;font-size:12px">Ver ficha completa →</a>`,
        );
      }

      if (fichaInferior) mapa.on("click", () => setSeleccionado(null));

      if (grupo.length > 1) {
        mapa.fitBounds(L.latLngBounds(grupo), { padding: [40, 40], maxZoom: 15 });
      }
    }

    void montar();

    return () => {
      activo = false;
      if (mapaRef.current) {
        (mapaRef.current as { remove: () => void }).remove();
        mapaRef.current = null;
      }
    };
  }, [puntos, centro.lat, centro.lng, zoom, miUbicacion?.lat, miUbicacion?.lng, fichaInferior]);

  const lienzo = (
    <div
      ref={contenedor}
      style={{ height: alto }}
      className="w-full overflow-hidden rounded-2xl border border-borde"
      role="application"
      aria-label="Mapa de actores del territorio"
    />
  );

  if (!fichaInferior) return lienzo;

  return (
    <div className="relative">
      {lienzo}

      <button
        type="button"
        onClick={irAMiUbicacion}
        disabled={ubicando}
        aria-label="Ir a mi ubicación"
        title="Mi ubicación"
        className="absolute right-3 top-3 z-[500] grid h-10 w-10 place-items-center rounded-full border border-borde bg-superficie text-marca shadow-tarjeta transition hover:bg-superficie2 disabled:opacity-60"
      >
        <Crosshair size={18} className={ubicando ? "animate-pulse" : undefined} />
      </button>

      {seleccionado ? (
        <div className="absolute inset-x-3 bottom-3 z-[500]">
          <div className="tarjeta flex items-center gap-3 p-3 shadow-flotante">
            <Avatar nombre={seleccionado.nombre} url={seleccionado.avatarUrl ?? null} tamano={48} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-texto">{seleccionado.nombre}</p>
              {seleccionado.categoria ? (
                <p className="truncate text-xs text-tenue">{seleccionado.categoria}</p>
              ) : null}
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-tenue">
                {seleccionado.reputacion ? (
                  <span className="inline-flex items-center gap-0.5 text-texto">
                    <Star size={12} className="fill-current text-alerta" />
                    {seleccionado.reputacion}
                    {seleccionado.reputacionConteo ? (
                      <span className="text-tenue">({seleccionado.reputacionConteo})</span>
                    ) : null}
                  </span>
                ) : null}
                {seleccionado.distancia || seleccionado.comuna ? (
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin size={11} />
                    {[seleccionado.distancia, seleccionado.comuna].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
                {seleccionado.disponible ? (
                  <span className="text-exito">Disponible ahora</span>
                ) : null}
              </p>
            </div>
            <Link
              href={`/p/${seleccionado.slug}`}
              className="shrink-0 rounded-lg bg-marca px-3 py-2 text-xs font-medium text-white transition hover:bg-marca-fuerte"
            >
              Ver ficha
            </Link>
            <button
              type="button"
              onClick={() => setSeleccionado(null)}
              aria-label="Cerrar ficha"
              className="shrink-0 rounded-lg p-1 text-tenue transition hover:bg-superficie2"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

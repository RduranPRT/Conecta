"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

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
  zoom = 13,
  alto = "70vh",
}: {
  puntos: PuntoMapa[];
  centro: { lat: number; lng: number };
  zoom?: number;
  alto?: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<unknown>(null);

  useEffect(() => {
    let activo = true;

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

        const detalles = [
          punto.categoria,
          punto.comuna,
          punto.distancia,
          punto.disponible ? "Disponible ahora" : null,
          punto.reputacion ? `${punto.reputacion} ★` : null,
        ]
          .filter(Boolean)
          .join(" · ");

        L.marker([punto.lat, punto.lng], { icon: icono })
          .addTo(mapa)
          .bindPopup(
            `<strong style="font-size:14px">${punto.nombre}</strong>` +
              `<br><span style="opacity:.7;font-size:12px">${detalles}</span>` +
              `<br><a href="/p/${punto.slug}" style="color:#0f766e;font-weight:500;font-size:12px">Ver ficha completa →</a>`,
          );

        grupo.push([punto.lat, punto.lng]);
      }

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
  }, [puntos, centro.lat, centro.lng, zoom]);

  return (
    <div
      ref={contenedor}
      style={{ height: alto }}
      className="w-full overflow-hidden rounded-2xl border border-borde"
      role="application"
      aria-label="Mapa de actores del territorio"
    />
  );
}

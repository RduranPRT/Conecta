"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Aviso } from "@/components/ui";

/**
 * Al entrar al mapa sin haber elegido comuna a mano, intenta ubicar al
 * usuario con la geolocalización del navegador y agrega lat/lng a la URL.
 * La pantalla (mapa/page.tsx) es quien decide qué hacer con esas coordenadas
 * (comuna más cercana, centro del mapa); este componente solo las consigue.
 */
export function GeolocalizarMapa({ activo }: { activo: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [estado, setEstado] = useState<"buscando" | "error" | "listo">(
    activo ? "buscando" : "listo",
  );

  useEffect(() => {
    if (!activo) return;

    if (!("geolocation" in navigator)) {
      setEstado("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", posicion.coords.latitude.toFixed(6));
        params.set("lng", posicion.coords.longitude.toFixed(6));
        router.replace(`/mapa?${params.toString()}`);
        setEstado("listo");
      },
      () => setEstado("error"),
      { enableHighAccuracy: true, timeout: 8_000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo]);

  if (estado !== "error") return null;

  return (
    <Aviso tono="alerta">
      No pudimos acceder a tu ubicación. Elige tu comuna abajo para ver a los proveedores más
      cercanos.
    </Aviso>
  );
}

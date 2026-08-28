"use client";

import { useTransition } from "react";

import { accionResolverVerificacion } from "@/app/acciones";
import { Boton } from "@/components/ui";

export function BotonVerificacion({
  id,
  estado,
}: {
  id: number;
  estado: "verificado" | "rechazado";
}) {
  const [pendiente, iniciar] = useTransition();

  return (
    <Boton
      tamano="sm"
      variante={estado === "verificado" ? "primario" : "peligro"}
      disabled={pendiente}
      onClick={() => iniciar(() => void accionResolverVerificacion(id, estado))}
    >
      {estado === "verificado" ? "Verificar" : "Rechazar"}
    </Boton>
  );
}

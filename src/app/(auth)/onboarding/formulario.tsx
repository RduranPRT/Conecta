"use client";

import { useActionState } from "react";

import { accionCrearPerfil, type EstadoAccion } from "@/app/acciones";
import {
  CamposFicha,
  type OpcionCategoria,
  type OpcionComuna,
} from "@/components/campos-ficha";
import { Aviso, Boton } from "@/components/ui";

export function FormularioPerfil({
  comunas,
  categorias,
  nombreSugerido,
}: {
  comunas: OpcionComuna[];
  categorias: OpcionCategoria[];
  nombreSugerido: string;
}) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(
    accionCrearPerfil,
    {},
  );

  return (
    <form action={enviar} className="space-y-6">
      {estado?.error ? <Aviso tono="peligro">{estado.error}</Aviso> : null}

      <CamposFicha
        comunas={comunas}
        categorias={categorias}
        inicial={{ nombre: nombreSugerido, roles: ["persona"] }}
      />

      <Boton type="submit" className="w-full" disabled={pendiente}>
        {pendiente ? "Guardando…" : "Entrar a Conecta"}
      </Boton>
    </form>
  );
}

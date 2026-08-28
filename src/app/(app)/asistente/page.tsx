import type { Metadata } from "next";

import { BotonEnlace, Encabezado, Tarjeta } from "@/components/ui";
import { hayModelo } from "@/lib/ia";
import { requerirPerfil } from "@/lib/sesion";

import { Conversacion } from "./conversacion";

export const metadata: Metadata = { title: "Asistente IA" };
export const dynamic = "force-dynamic";

export default async function PaginaAsistente() {
  const perfil = await requerirPerfil("/asistente");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Encabezado
        titulo="Asistente"
        bajada="Coordina lo que la plataforma ya sabe hacer: buscar, revisar tu actividad y proponerte el siguiente paso."
        acciones={
          <BotonEnlace href="/agentes" variante="secundario" tamano="sm">
            Agentes especializados
          </BotonEnlace>
        }
      />

      <Conversacion nombre={perfil.nombre} />

      <Tarjeta className="p-4">
        <h2 className="titulo-seccion">Cómo funciona hoy</h2>
        <p className="mt-2 text-xs leading-relaxed text-tenue">
          {hayModelo()
            ? "Hay un modelo configurado (ANTHROPIC_API_KEY): interpreta tus frases y devuelve la misma estructura de intención que usa el motor de reglas. Si el modelo falla o responde algo inválido, la plataforma vuelve a reglas sin interrumpirte."
            : "No hay modelo configurado. La interpretación corre con reglas deterministas —categoría, comuna, urgencia, presupuesto, tipo de actor— y todas las respuestas salen de consultas reales. Basta definir ANTHROPIC_API_KEY para que el modelo tome el relevo sin cambiar nada más."}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-tenue">
          Los agentes que ejecutan por su cuenta llegan en la Fase 2. El principio no cambia: la
          autonomía pertenece al usuario, y pagos, contrataciones y compromisos siempre requieren
          autorización explícita.
        </p>
      </Tarjeta>
    </div>
  );
}

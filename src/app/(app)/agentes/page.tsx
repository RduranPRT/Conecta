import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { ShieldAlert } from "lucide-react";

import { Aviso, Encabezado, Tarjeta } from "@/components/ui";
import { db } from "@/db";
import { agentes, agentesContratados } from "@/db/schema";
import { requerirPerfil } from "@/lib/sesion";

import { TarjetaAgente } from "./tarjeta-agente";

export const metadata: Metadata = { title: "Agentes IA" };
export const dynamic = "force-dynamic";

export default async function PaginaAgentes() {
  const perfil = await requerirPerfil("/agentes");

  const [catalogo, contratados] = await Promise.all([
    db.select().from(agentes).orderBy(asc(agentes.orden)),
    db.select().from(agentesContratados).where(eq(agentesContratados.perfilId, perfil.id)),
  ]);

  const porCodigo = new Map(contratados.filter((c) => c.activo).map((c) => [c.agenteCodigo, c]));
  const deUsuario = catalogo.filter((a) => a.ambito === "usuario");
  const deAdmin = catalogo.filter((a) => a.ambito === "administracion");

  return (
    <div className="space-y-8">
      <Encabezado
        titulo="Agentes"
        bajada="Contrata y configura agentes por separado. Cada uno tiene un nivel de autonomía que fijas tú, no el agente."
      />

      <Aviso tono="marca">
        <span className="flex items-start gap-2">
          <ShieldAlert size={16} className="mt-0.5 shrink-0" />
          <span>
            Las acciones sensibles —pagos, transferencias, contrataciones, compromisos
            contractuales y cambios de precio importantes— siempre requieren autorización humana
            explícita, sea cual sea el nivel configurado.
          </span>
        </span>
      </Aviso>

      <section>
        <h2 className="titulo-seccion mb-3">Para tu actividad</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {deUsuario.map((a) => (
            <TarjetaAgente
              key={a.codigo}
              codigo={a.codigo}
              nombre={a.nombre}
              descripcion={a.descripcion}
              disponible={a.disponible}
              contratado={porCodigo.has(a.codigo)}
              nivelActual={porCodigo.get(a.codigo)?.nivelAutonomia ?? null}
            />
          ))}
        </div>
      </section>

      {deAdmin.length ? (
        <section>
          <h2 className="titulo-seccion mb-1">Agentes de administración</h2>
          <p className="mb-3 text-xs text-tenue">
            Operan dentro del Centro de Control, no en tu cuenta. Se listan para dejar explícito
            qué vigila la plataforma.
          </p>
          <Tarjeta className="divide-y divide-borde">
            {deAdmin.map((a) => (
              <div key={a.codigo} className="px-4 py-3">
                <p className="text-sm font-medium text-texto">{a.nombre}</p>
                <p className="mt-0.5 text-xs text-tenue">{a.descripcion}</p>
              </div>
            ))}
          </Tarjeta>
        </section>
      ) : null}

      <Tarjeta className="p-4">
        <h2 className="titulo-seccion">Qué es gratis y qué no</h2>
        <p className="mt-2 text-xs leading-relaxed text-tenue">
          Crear cuenta y perfil, aparecer en el buscador y en el mapa, publicar, buscar,
          contactar, recibir reseñas y recibir oportunidades básicas son y seguirán siendo
          gratis. Los agentes se contratan por separado o en planes, con una capacidad gratuita
          limitada para probarlos. Pagar aumenta capacidades y visibilidad; nunca compra
          confianza.
        </p>
      </Tarjeta>
    </div>
  );
}

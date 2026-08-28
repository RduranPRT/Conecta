import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";

import { Aviso, Encabezado, Insignia, Tarjeta } from "@/components/ui";
import { db } from "@/db";
import { eventos, perfiles, verificaciones } from "@/db/schema";
import { fechaHora } from "@/lib/formato";
import { obtenerSesion, requerirPerfil } from "@/lib/sesion";

import { BotonVerificacion } from "./acciones-cliente";

export const metadata: Metadata = { title: "Centro de Control" };
export const dynamic = "force-dynamic";

export default async function PaginaCentroDeControl() {
  await requerirPerfil("/centro-de-control");
  const sesion = await obtenerSesion();

  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const esAdmin = Boolean(
    sesion?.user?.email && admins.includes(sesion.user.email.toLowerCase()),
  );

  if (!esAdmin) {
    return (
      <div className="mx-auto max-w-xl">
        <Encabezado titulo="Centro de Control" />
        <Aviso tono="alerta">
          Esta sección es del equipo de la plataforma. Para habilitar tu cuenta, agrega tu correo
          a la variable de entorno <code>ADMIN_EMAILS</code> (separada por comas) y vuelve a
          desplegar.
        </Aviso>
      </div>
    );
  }

  const [metricas, pendientes, ultimosEventos, ultimosPerfiles] = await Promise.all([
    db.execute<{
      perfiles: number;
      necesidades: number;
      operaciones: number;
      calificaciones: number;
    }>(sql`select
        (select count(*)::int from perfiles) as perfiles,
        (select count(*)::int from necesidades) as necesidades,
        (select count(*)::int from operaciones) as operaciones,
        (select count(*)::int from calificaciones) as calificaciones`),
    db
      .select({ verificacion: verificaciones, perfilNombre: perfiles.nombre, slug: perfiles.slug })
      .from(verificaciones)
      .innerJoin(perfiles, eq(perfiles.id, verificaciones.perfilId))
      .where(eq(verificaciones.estado, "pendiente"))
      .limit(20),
    db
      .select({ evento: eventos, actorNombre: perfiles.nombre })
      .from(eventos)
      .leftJoin(perfiles, eq(perfiles.id, eventos.actorPerfilId))
      .orderBy(desc(eventos.creadoEn))
      .limit(15),
    db.select().from(perfiles).orderBy(desc(perfiles.creadoEn)).limit(10),
  ]);

  const m = metricas[0] ?? {
    perfiles: 0,
    necesidades: 0,
    operaciones: 0,
    calificaciones: 0,
  };

  const tasaAdjudicacion =
    Number(m.necesidades) > 0
      ? Math.round((Number(m.operaciones) / Number(m.necesidades)) * 100)
      : 0;

  return (
    <div className="space-y-8">
      <Encabezado
        titulo="Centro de Control"
        bajada="Panel de operación de la plataforma. En la Fase 2, los agentes administrativos detectan y recomiendan aquí; las decisiones críticas siguen siendo humanas."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { valor: m.perfiles, etiqueta: "perfiles" },
          { valor: m.necesidades, etiqueta: "necesidades" },
          { valor: m.operaciones, etiqueta: "operaciones" },
          { valor: m.calificaciones, etiqueta: "calificaciones" },
        ].map((k) => (
          <Tarjeta key={k.etiqueta} className="px-4 py-5 text-center">
            <p className="text-2xl font-semibold text-texto">{Number(k.valor)}</p>
            <p className="mt-1 text-xs text-tenue">{k.etiqueta}</p>
          </Tarjeta>
        ))}
      </div>

      <Tarjeta className="p-5">
        <h2 className="titulo-seccion">Lectura del embudo</h2>
        <p className="mt-2 text-sm text-texto">
          {tasaAdjudicacion}% de las necesidades publicadas terminaron en una operación
          adjudicada. {Number(m.calificaciones) === 0
            ? "Todavía no hay calificaciones: sin ese octavo paso, la red no mejora con el uso."
            : `Se registraron ${Number(m.calificaciones)} calificaciones.`}
        </p>
      </Tarjeta>

      <section>
        <h2 className="titulo-seccion mb-3">Verificaciones pendientes</h2>
        {pendientes.length ? (
          <Tarjeta className="divide-y divide-borde">
            {pendientes.map(({ verificacion, perfilNombre, slug }) => (
              <div key={verificacion.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/p/${slug}`} className="text-sm text-texto hover:text-marca">
                    {perfilNombre}
                  </Link>
                  <p className="text-xs text-tenue">
                    {verificacion.tipo.replace("_", " ")} · solicitada{" "}
                    {fechaHora(verificacion.creadoEn)}
                  </p>
                </div>
                <BotonVerificacion id={verificacion.id} estado="verificado" />
                <BotonVerificacion id={verificacion.id} estado="rechazado" />
              </div>
            ))}
          </Tarjeta>
        ) : (
          <Tarjeta className="px-4 py-6 text-center text-sm text-tenue">
            No hay verificaciones pendientes.
          </Tarjeta>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="titulo-seccion mb-3">Últimos movimientos</h2>
          <Tarjeta className="divide-y divide-borde">
            {ultimosEventos.map(({ evento, actorNombre }) => (
              <div key={evento.id} className="px-4 py-2.5 text-sm">
                <p className="text-texto">{evento.tipo}</p>
                <p className="text-xs text-tenue">
                  {fechaHora(evento.creadoEn)}
                  {actorNombre ? ` · ${actorNombre}` : ""}
                </p>
              </div>
            ))}
          </Tarjeta>
        </section>

        <section>
          <h2 className="titulo-seccion mb-3">Últimos perfiles</h2>
          <Tarjeta className="divide-y divide-borde">
            {ultimosPerfiles.map((p) => (
              <Link
                key={p.id}
                href={`/p/${p.slug}`}
                className="flex items-center justify-between px-4 py-2.5 transition hover:bg-superficie2"
              >
                <span className="text-sm text-texto">{p.nombre}</span>
                <Insignia tono="contorno">{p.plan}</Insignia>
              </Link>
            ))}
          </Tarjeta>
        </section>
      </div>

      <Tarjeta className="p-4">
        <h2 className="titulo-seccion">Qué falta para el Centro de Control completo</h2>
        <p className="mt-2 text-xs leading-relaxed text-tenue">
          Este panel cubre métricas, verificaciones y traza. Moderación de contenido denunciado,
          gestión de planes y suscripciones, publicidad territorial y resolución de disputas
          quedan modelados en la base pero sin pantalla propia: entran cuando el flujo
          transaccional tenga volumen real que administrar.
        </p>
      </Tarjeta>
    </div>
  );
}

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  categorias,
  comunas,
  invitaciones,
  necesidades,
  perfiles,
  propuestas,
  publicaciones,
  type Necesidad,
} from "@/db/schema";
import { contextoInterprete, interpretar, type Intencion } from "@/lib/ia";
import { intencionVacia } from "@/lib/ia/tipos";

import { buscarActores, type ActorResumen } from "./actores";
import { registrarEvento } from "./eventos";

export type EntradaNecesidad = {
  solicitantePerfilId: number;
  titulo: string;
  descripcion: string;
  categoriaId?: number | null;
  comunaId?: number | null;
  presupuestoMin?: number | null;
  presupuestoMax?: number | null;
  moneda?: string;
  urgencia?: "hoy" | "semana" | "mes" | "flexible";
  fechaRequerida?: string | null;
  publicarEnFeed?: boolean;
};

/**
 * R2 · Publicar una necesidad.
 *
 * Una necesidad es a la vez un registro transaccional y una publicación del
 * feed: el prompt exige que el contenido se convierta en acción, no que existan
 * dos objetos parecidos que hay que mantener sincronizados.
 */
export async function publicarNecesidad(entrada: EntradaNecesidad) {
  const solicitante = await db.query.perfiles.findFirst({
    where: eq(perfiles.id, entrada.solicitantePerfilId),
  });
  if (!solicitante) throw new Error("El perfil solicitante no existe.");

  const contexto = await contextoInterprete(solicitante.comunaId);
  const intencion = await interpretar(
    `${entrada.titulo}. ${entrada.descripcion}`,
    contexto,
  );

  const comunaId = entrada.comunaId ?? intencion.comunaId ?? solicitante.comunaId ?? null;
  const categoriaId = entrada.categoriaId ?? intencion.categoriaId ?? null;
  const urgencia =
    entrada.urgencia ?? (intencion.disponibilidad === "hoy" ? "hoy" : "flexible");

  const comuna = comunaId
    ? await db.query.comunas.findFirst({ where: eq(comunas.id, comunaId) })
    : null;

  const creada = await db.transaction(async (tx) => {
    const [necesidad] = await tx
      .insert(necesidades)
      .values({
        solicitantePerfilId: entrada.solicitantePerfilId,
        titulo: entrada.titulo.trim(),
        descripcion: entrada.descripcion.trim(),
        categoriaId,
        comunaId,
        lat: solicitante.lat ?? comuna?.lat ?? null,
        lng: solicitante.lng ?? comuna?.lng ?? null,
        presupuestoMin: entrada.presupuestoMin?.toString() ?? null,
        presupuestoMax:
          entrada.presupuestoMax?.toString() ?? intencion.presupuestoMax?.toString() ?? null,
        moneda: entrada.moneda ?? "CLP",
        urgencia,
        fechaRequerida: entrada.fechaRequerida ?? null,
        interpretacion: {
          motor: intencion.motor,
          explicacion: intencion.explicacion,
          terminos: intencion.terminos,
          categoriaNombre: intencion.categoriaNombre,
        },
      })
      .returning();

    if (entrada.publicarEnFeed !== false) {
      await tx.insert(publicaciones).values({
        autorPerfilId: entrada.solicitantePerfilId,
        tipo: "necesidad",
        titulo: necesidad.titulo,
        cuerpo: necesidad.descripcion,
        categoriaId,
        comunaId,
        necesidadId: necesidad.id,
      });
    }

    await registrarEvento(
      {
        tipo: "necesidad.publicada",
        entidad: "necesidad",
        entidadId: necesidad.id,
        actorPerfilId: entrada.solicitantePerfilId,
        datos: { urgencia, categoriaId, comunaId, motor: intencion.motor },
      },
      tx as unknown as typeof db,
    );

    return necesidad;
  });

  // El matching corre inmediatamente: una necesidad publicada se convierte en
  // oportunidades sin que nadie apriete otro botón.
  const oportunidades = await generarOportunidades(creada.id, { limite: 6 });

  return { necesidad: creada, intencion, oportunidades };
}

/** Convierte una necesidad en candidatos ordenados, sin escribir nada. */
export async function calcularMatch(
  necesidad: Necesidad,
  limite = 10,
): Promise<ActorResumen[]> {
  const contexto = await contextoInterprete(necesidad.comunaId);
  const guardada = (necesidad.interpretacion ?? {}) as { terminos?: string[] };

  const intencion: Intencion = {
    ...intencionVacia(necesidad.titulo),
    terminos: guardada.terminos ?? [],
    categoriaId: necesidad.categoriaId,
    comunaId: necesidad.comunaId,
    disponibilidad: necesidad.urgencia === "hoy" ? "hoy" : "cualquiera",
    cerca: true,
  };

  void contexto;

  const candidatos = await buscarActores(intencion, {
    desde:
      necesidad.lat !== null && necesidad.lng !== null
        ? { lat: necesidad.lat, lng: necesidad.lng }
        : null,
    roles: ["prestador", "negocio", "proveedor", "productor"],
    limite: limite + 5,
  });

  return candidatos
    .filter((c) => c.id !== necesidad.solicitantePerfilId)
    .slice(0, limite);
}

/** R3 · El match escribe invitaciones: «Nueva oportunidad a 2,3 km». */
export async function generarOportunidades(
  necesidadId: number,
  opciones: { limite?: number } = {},
) {
  const necesidad = await db.query.necesidades.findFirst({
    where: eq(necesidades.id, necesidadId),
  });
  if (!necesidad) throw new Error("La necesidad no existe.");

  const candidatos = await calcularMatch(necesidad, opciones.limite ?? 6);
  if (!candidatos.length) return [];

  const valores = candidatos.map((c) => ({
    necesidadId,
    perfilId: c.id,
    origen: "ia" as const,
    distanciaKm: c.distanciaKm !== null ? c.distanciaKm.toFixed(2) : null,
    puntaje: c.puntaje.toFixed(3),
    motivo: c.motivo || null,
  }));

  await db.insert(invitaciones).values(valores).onConflictDoNothing();

  await registrarEvento({
    tipo: "necesidad.oportunidades_generadas",
    entidad: "necesidad",
    entidadId: necesidadId,
    datos: { candidatos: candidatos.length },
  });

  return candidatos;
}

/** Invitación manual desde el buscador o el mapa. */
export async function invitarACotizar(entrada: {
  necesidadId: number;
  perfilId: number;
  actorPerfilId: number;
}) {
  const necesidad = await db.query.necesidades.findFirst({
    where: eq(necesidades.id, entrada.necesidadId),
  });
  if (!necesidad) throw new Error("La necesidad no existe.");
  if (necesidad.solicitantePerfilId !== entrada.actorPerfilId) {
    throw new Error("Solo quien publicó la necesidad puede invitar a cotizar.");
  }
  if (necesidad.estado !== "publicada" && necesidad.estado !== "en_cotizacion") {
    throw new Error("Esta necesidad ya no admite nuevas invitaciones.");
  }

  await db
    .insert(invitaciones)
    .values({ necesidadId: entrada.necesidadId, perfilId: entrada.perfilId, origen: "manual" })
    .onConflictDoNothing();

  await registrarEvento({
    tipo: "necesidad.invitacion_manual",
    entidad: "necesidad",
    entidadId: entrada.necesidadId,
    actorPerfilId: entrada.actorPerfilId,
    datos: { invitado: entrada.perfilId },
  });
}

export async function obtenerNecesidad(id: number) {
  const filas = await db
    .select({
      necesidad: necesidades,
      solicitante: perfiles,
      comunaNombre: comunas.nombre,
      categoriaNombre: categorias.nombre,
    })
    .from(necesidades)
    .innerJoin(perfiles, eq(perfiles.id, necesidades.solicitantePerfilId))
    .leftJoin(comunas, eq(comunas.id, necesidades.comunaId))
    .leftJoin(categorias, eq(categorias.id, necesidades.categoriaId))
    .where(eq(necesidades.id, id))
    .limit(1);

  return filas[0] ?? null;
}

export async function listarNecesidades(opciones: {
  comunaId?: number | null;
  categoriaId?: number | null;
  estado?: (typeof necesidades.estado.enumValues)[number][];
  solicitantePerfilId?: number;
  limite?: number;
}) {
  const condiciones = [];
  if (opciones.comunaId) condiciones.push(eq(necesidades.comunaId, opciones.comunaId));
  if (opciones.categoriaId) condiciones.push(eq(necesidades.categoriaId, opciones.categoriaId));
  if (opciones.estado?.length) condiciones.push(inArray(necesidades.estado, opciones.estado));
  if (opciones.solicitantePerfilId) {
    condiciones.push(eq(necesidades.solicitantePerfilId, opciones.solicitantePerfilId));
  }

  return db
    .select({
      necesidad: necesidades,
      solicitanteNombre: perfiles.nombre,
      solicitanteSlug: perfiles.slug,
      comunaNombre: comunas.nombre,
      categoriaNombre: categorias.nombre,
      propuestas: sql<number>`(
        select count(*) from ${propuestas}
        where ${propuestas.necesidadId} = ${necesidades.id}
          and ${propuestas.estado} <> 'retirada'
      )`.as("propuestas"),
    })
    .from(necesidades)
    .innerJoin(perfiles, eq(perfiles.id, necesidades.solicitantePerfilId))
    .leftJoin(comunas, eq(comunas.id, necesidades.comunaId))
    .leftJoin(categorias, eq(categorias.id, necesidades.categoriaId))
    .where(condiciones.length ? and(...condiciones) : undefined)
    .orderBy(desc(necesidades.creadoEn))
    .limit(opciones.limite ?? 30);
}

/** Oportunidades que le llegaron a un actor que ofrece. */
export async function oportunidadesDe(perfilId: number, limite = 20) {
  return db
    .select({
      invitacion: invitaciones,
      necesidad: necesidades,
      solicitanteNombre: perfiles.nombre,
      comunaNombre: comunas.nombre,
      categoriaNombre: categorias.nombre,
      yaPropuso: sql<boolean>`exists (
        select 1 from ${propuestas}
        where ${propuestas.necesidadId} = ${necesidades.id}
          and ${propuestas.perfilId} = ${perfilId}
          and ${propuestas.estado} <> 'retirada'
      )`.as("ya_propuso"),
    })
    .from(invitaciones)
    .innerJoin(necesidades, eq(necesidades.id, invitaciones.necesidadId))
    .innerJoin(perfiles, eq(perfiles.id, necesidades.solicitantePerfilId))
    .leftJoin(comunas, eq(comunas.id, necesidades.comunaId))
    .leftJoin(categorias, eq(categorias.id, necesidades.categoriaId))
    .where(and(eq(invitaciones.perfilId, perfilId), inArray(necesidades.estado, ["publicada", "en_cotizacion"])))
    .orderBy(desc(invitaciones.creadoEn))
    .limit(limite);
}

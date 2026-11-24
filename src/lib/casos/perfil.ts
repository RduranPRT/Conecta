import { eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  categorias,
  coberturas,
  comunas,
  perfilCategorias,
  perfilRoles,
  perfiles,
  type RolActor,
  type TipoIdentidad,
} from "@/db/schema";
import { distanciaKm } from "@/lib/geo";
import { ROLES_QUE_OFRECEN } from "@/lib/roles";
import { normalizarTelefono } from "@/lib/telefono";
import { slugificar } from "@/lib/utils";

import {
  actividadesPropias,
  filtrarActividades,
  fijarActividadesPropias,
  solicitarCategoria,
} from "./categorias";
import { registrarEvento } from "./eventos";
import type { DatosPerfilRequisitos } from "./requisitos";
import { prefijoTelefonico } from "./territorio";

async function slugLibre(base: string) {
  const raiz = slugificar(base) || "perfil";
  let candidato = raiz;
  let n = 1;
  // Bucle acotado: en la práctica termina en el primer o segundo intento.
  while (n < 50) {
    const existe = await db
      .select({ x: sql`1` })
      .from(perfiles)
      .where(eq(perfiles.slug, candidato))
      .limit(1);
    if (!existe.length) return candidato;
    n += 1;
    candidato = `${raiz}-${n}`;
  }
  return `${raiz}-${Date.now()}`;
}

type DatosFicha = {
  nombre: string;
  tipoIdentidad?: TipoIdentidad;
  roles: RolActor[];
  comunaId?: number | null;
  identificadorFiscal?: string | null;
  telefono?: string | null;
  descripcion?: string | null;
  direccion?: string | null;
  categoriaIds?: number[];
  /** Actividades que no estaban en la lista («Otro»). */
  otrasActividades?: string[];
  radioKm?: number | null;
  /** Coordenadas exactas tomadas con la geolocalización del navegador. */
  lat?: number | null;
  lng?: number | null;
};

/**
 * Reglas de la ficha, comunes al alta y a la edición. Viven aquí para que el
 * formulario y un agente se encuentren con las mismas exigencias (S04, S16):
 * - nombre y comuna son lo único obligatorio para todos;
 * - quien ofrece algo declara al menos una actividad, de la lista u «Otro»;
 * - nunca se exige un oficio para vender productos.
 */
async function validarFicha(datos: DatosFicha) {
  const nombre = datos.nombre.trim();
  if (nombre.length < 2) throw new Error("Escribe el nombre con el que quieres aparecer.");
  if (!datos.comunaId) {
    throw new Error(
      "Elige tu comuna: sirve para mostrarte lo que está cerca y para que te encuentren.",
    );
  }
  const comuna = await db.query.comunas.findFirst({ where: eq(comunas.id, datos.comunaId) });
  if (!comuna) throw new Error("La comuna elegida no existe.");

  const roles = datos.roles.length ? [...new Set(datos.roles)] : (["persona"] as RolActor[]);
  const categoriaIds = await filtrarActividades([...new Set(datos.categoriaIds ?? [])]);
  const otras = (datos.otrasActividades ?? []).map((t) => t.trim()).filter((t) => t.length >= 3);

  if (roles.some((r) => ROLES_QUE_OFRECEN.includes(r)) && !categoriaIds.length && !otras.length) {
    throw new Error(
      "Cuéntanos qué ofreces: elige al menos una actividad o descríbela en «No encuentro mi actividad».",
    );
  }

  const prefijo = await prefijoTelefonico(comuna.id);
  const telefono = datos.telefono?.trim() ? normalizarTelefono(prefijo, datos.telefono) : null;

  return { nombre, comuna, roles, categoriaIds, otras, telefono };
}

/**
 * R1 · Alta e identidad.
 * Una identidad, varios roles: nunca se crean cuentas distintas para el mismo
 * usuario que además vende, produce o presta servicios.
 */
export async function crearPerfil(entrada: DatosFicha & { usuarioId: string }) {
  const { nombre, comuna, roles, categoriaIds, otras, telefono } = await validarFicha(entrada);

  const slug = await slugLibre(nombre);

  const perfil = await db.transaction(async (tx) => {
    const [creado] = await tx
      .insert(perfiles)
      .values({
        usuarioId: entrada.usuarioId,
        slug,
        nombre,
        tipoIdentidad: entrada.tipoIdentidad ?? "persona",
        descripcion: entrada.descripcion?.trim() || null,
        identificadorFiscal: entrada.identificadorFiscal?.trim() || null,
        telefono,
        direccion: entrada.direccion?.trim() || null,
        comunaId: comuna.id,
        // Si el usuario compartió su ubicación real, esa manda. Si no, se
        // parte del centro de la comuna y puede ajustarse después.
        lat: entrada.lat ?? comuna.lat,
        lng: entrada.lng ?? comuna.lng,
        radioKm: entrada.radioKm ?? null,
      })
      .returning();

    await tx
      .insert(perfilRoles)
      .values(roles.map((rol) => ({ perfilId: creado.id, rol })))
      .onConflictDoNothing();

    if (categoriaIds.length) {
      await tx
        .insert(perfilCategorias)
        .values(
          categoriaIds.map((categoriaId, i) => ({
            perfilId: creado.id,
            categoriaId,
            principal: i === 0,
          })),
        )
        .onConflictDoNothing();
    }

    await tx
      .insert(coberturas)
      .values({ perfilId: creado.id, comunaId: comuna.id })
      .onConflictDoNothing();

    return creado;
  });

  for (const texto of otras) await solicitarCategoria({ perfilId: perfil.id, texto });

  await registrarEvento({
    tipo: "perfil.creado",
    entidad: "perfil",
    entidadId: perfil.id,
    actorPerfilId: perfil.id,
    datos: { roles, categorias: categoriaIds, otrasActividades: otras },
  });

  return perfil;
}

/**
 * Edición completa de la ficha (P03): mismas reglas que el alta. Datos
 * comerciales, roles, actividades y cobertura se guardan juntos.
 */
export async function guardarFicha(
  perfilId: number,
  datos: DatosFicha & {
    correoPublico?: string | null;
    sitioWeb?: string | null;
    coberturaIds?: number[];
  },
) {
  const { nombre, comuna, roles, categoriaIds, otras, telefono } = await validarFicha(datos);

  await actualizarPerfil(perfilId, {
    nombre,
    tipoIdentidad: datos.tipoIdentidad,
    descripcion: datos.descripcion?.trim() || null,
    telefono,
    correoPublico: datos.correoPublico?.trim() || null,
    sitioWeb: datos.sitioWeb?.trim() || null,
    direccion: datos.direccion?.trim() || null,
    identificadorFiscal: datos.identificadorFiscal?.trim() || null,
    comunaId: comuna.id,
    radioKm: datos.radioKm ?? null,
    lat: datos.lat ?? null,
    lng: datos.lng ?? null,
  });
  await fijarRoles(perfilId, roles);
  await fijarCategorias(perfilId, categoriaIds);
  await fijarActividadesPropias(perfilId, otras);
  await fijarCoberturas(perfilId, [...new Set([comuna.id, ...(datos.coberturaIds ?? [])])]);
}

/** Completa un solo dato que una acción pidió en el momento (S05). */
export async function completarTelefono(perfilId: number, telefono: string) {
  const perfil = await db.query.perfiles.findFirst({ where: eq(perfiles.id, perfilId) });
  if (!perfil) throw new Error("No encontramos tu perfil.");
  const normalizado = normalizarTelefono(await prefijoTelefonico(perfil.comunaId), telefono);
  if (!normalizado) throw new Error("Escribe tu teléfono.");
  await actualizarPerfil(perfilId, { telefono: normalizado });
}

/** Lo que miran los requisitos por acción. */
export async function datosParaRequisitos(perfilId: number): Promise<DatosPerfilRequisitos> {
  const [perfil, cats, propias] = await Promise.all([
    db.query.perfiles.findFirst({ where: eq(perfiles.id, perfilId) }),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(perfilCategorias)
      .where(eq(perfilCategorias.perfilId, perfilId)),
    actividadesPropias(perfilId),
  ]);
  return {
    comunaId: perfil?.comunaId ?? null,
    telefono: perfil?.telefono ?? null,
    identificadorFiscal: perfil?.identificadorFiscal ?? null,
    actividades: Number(cats[0]?.total ?? 0) + propias.length,
  };
}

export async function actualizarPerfil(
  perfilId: number,
  cambios: Partial<{
    nombre: string;
    tipoIdentidad: TipoIdentidad;
    descripcion: string | null;
    telefono: string | null;
    correoPublico: string | null;
    sitioWeb: string | null;
    direccion: string | null;
    comunaId: number | null;
    radioKm: number | null;
    identificadorFiscal: string | null;
    /** Coordenadas exactas tomadas con la geolocalización del navegador. */
    lat: number | null;
    lng: number | null;
  }>,
) {
  const { lat, lng, ...resto } = cambios;
  const valores: Record<string, unknown> = { ...resto, actualizadoEn: new Date() };
  for (const clave of Object.keys(valores)) {
    if (valores[clave] === undefined) delete valores[clave];
  }

  if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
    // La ubicación real que trae el usuario manda sobre el centroide de la comuna.
    valores.lat = lat;
    valores.lng = lng;
  } else if (cambios.comunaId) {
    const actual = await db.query.perfiles.findFirst({ where: eq(perfiles.id, perfilId) });
    // Solo se recentra si cambió de comuna: no se pisa un punto exacto ya fijado.
    if (actual?.comunaId !== cambios.comunaId) {
      const comuna = await db.query.comunas.findFirst({ where: eq(comunas.id, cambios.comunaId) });
      if (comuna) {
        valores.lat = comuna.lat;
        valores.lng = comuna.lng;
      }
    }
  }

  await db.update(perfiles).set(valores).where(eq(perfiles.id, perfilId));

  await registrarEvento({
    tipo: "perfil.actualizado",
    entidad: "perfil",
    entidadId: perfilId,
    actorPerfilId: perfilId,
  });
}

export async function fijarRoles(perfilId: number, roles: RolActor[]) {
  const activos = roles.length ? roles : (["persona"] as RolActor[]);
  await db.transaction(async (tx) => {
    await tx.update(perfilRoles).set({ activo: false }).where(eq(perfilRoles.perfilId, perfilId));
    await tx
      .insert(perfilRoles)
      .values(activos.map((rol) => ({ perfilId, rol, activo: true })))
      .onConflictDoUpdate({
        target: [perfilRoles.perfilId, perfilRoles.rol],
        set: { activo: true },
      });
  });
}

export async function fijarCategorias(perfilId: number, ids: number[]) {
  const categoriaIds = await filtrarActividades([...new Set(ids)]);
  await db.transaction(async (tx) => {
    await tx.delete(perfilCategorias).where(eq(perfilCategorias.perfilId, perfilId));
    if (categoriaIds.length) {
      await tx.insert(perfilCategorias).values(
        categoriaIds.map((categoriaId, i) => ({
          perfilId,
          categoriaId,
          principal: i === 0,
        })),
      );
    }
  });
}

export async function fijarCoberturas(perfilId: number, comunaIds: number[]) {
  await db.transaction(async (tx) => {
    await tx.delete(coberturas).where(eq(coberturas.perfilId, perfilId));
    if (comunaIds.length) {
      await tx.insert(coberturas).values(comunaIds.map((comunaId) => ({ perfilId, comunaId })));
    }
  });
}

/**
 * El cambio de disponibilidad es el ejemplo del prompt: una sola escritura que
 * el buscador, el mapa, el feed y el matching leen de inmediato porque todos
 * consultan la misma tabla.
 */
export async function fijarDisponibilidad(perfilId: number, disponible: boolean) {
  await db
    .update(perfiles)
    .set({
      disponibleAhora: disponible,
      disponibleHasta: disponible ? new Date(Date.now() + 8 * 3_600_000) : null,
      actualizadoEn: new Date(),
    })
    .where(eq(perfiles.id, perfilId));

  await registrarEvento({
    tipo: disponible ? "perfil.disponible" : "perfil.no_disponible",
    entidad: "perfil",
    entidadId: perfilId,
    actorPerfilId: perfilId,
  });
}

/**
 * Dada una coordenada (típicamente la geolocalización del navegador), busca
 * la comuna administrativa más cercana. Sirve para que el mapa arranque en
 * el territorio real del usuario sin que este tenga que elegirlo a mano.
 */
export async function comunaMasCercana(lat: number, lng: number) {
  const todas = await db
    .select({ id: comunas.id, nombre: comunas.nombre, lat: comunas.lat, lng: comunas.lng })
    .from(comunas);

  if (!todas.length) return null;

  let mejor = todas[0];
  let mejorDistancia = distanciaKm({ lat, lng }, { lat: mejor.lat, lng: mejor.lng });

  for (const candidata of todas.slice(1)) {
    const distancia = distanciaKm({ lat, lng }, { lat: candidata.lat, lng: candidata.lng });
    if (distancia < mejorDistancia) {
      mejor = candidata;
      mejorDistancia = distancia;
    }
  }

  return { ...mejor, distanciaKm: mejorDistancia };
}

export async function categoriasPorId(ids: number[]) {
  if (!ids.length) return [];
  return db.select().from(categorias).where(inArray(categorias.id, ids));
}

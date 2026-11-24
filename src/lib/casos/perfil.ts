import { and, eq, inArray, ne, sql } from "drizzle-orm";

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
import { ofreceAlgo, ROLES_QUE_OFRECEN } from "@/lib/roles";
import { esRutDeEmpresa, exigirRut, formatearRut } from "@/lib/rut";
import { normalizarTelefono } from "@/lib/telefono";
import { slugificar } from "@/lib/utils";

import {
  actividadesPropias,
  filtrarActividades,
  fijarActividadesPropias,
  solicitarCategoria,
} from "./categorias";
import { registrarEvento } from "./eventos";
import {
  exigirRequisitos,
  requisitosPara,
  type AccionConRequisitos,
  type DatosPerfilRequisitos,
} from "./requisitos";
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

/* ── RUT ─────────────────────────────────────────────────────────────────── */

const RUT_REPETIDO =
  "Ya existe una cuenta con ese RUT. Si es tuya, ingresa con tu correo; si no lo es, escríbenos.";

/** Valida el RUT y que nadie más lo tenga. Devuelve cómo se guarda. */
async function rutDisponible(texto: string | null | undefined, perfilId?: number) {
  const norm = exigirRut(texto);
  const [otro] = await db
    .select({ id: perfiles.id })
    .from(perfiles)
    .where(
      and(
        eq(perfiles.identificadorFiscalNorm, norm),
        perfilId ? ne(perfiles.id, perfilId) : undefined,
      ),
    )
    .limit(1);
  if (otro) throw new Error(RUT_REPETIDO);
  return { identificadorFiscalNorm: norm, identificadorFiscal: formatearRut(norm) };
}

/** El índice único es la última palabra si dos altas llegan al mismo tiempo. */
function traducirDuplicado(error: unknown): never {
  const codigo = (error as { code?: string; cause?: { code?: string } })?.code
    ?? (error as { cause?: { code?: string } })?.cause?.code;
  if (codigo === "23505") throw new Error(RUT_REPETIDO);
  throw error;
}

function nombreValido(nombre: string) {
  const limpio = nombre.trim();
  if (limpio.length < 2) throw new Error("Escribe el nombre con el que quieres aparecer.");
  return limpio.slice(0, 80);
}

/* ── Alta ────────────────────────────────────────────────────────────────── */

/**
 * Revisa el alta antes de crear la cuenta: así un RUT repetido no deja a nadie
 * con sesión y sin perfil.
 */
export async function revisarAlta(entrada: { nombre: string; rut: string }) {
  return {
    nombre: nombreValido(entrada.nombre),
    ...(await rutDisponible(entrada.rut)),
  };
}

type DatosOferta = {
  roles?: RolActor[];
  comunaId?: number | null;
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

async function comunaExistente(comunaId: number | null | undefined) {
  if (!comunaId) return null;
  const comuna = await db.query.comunas.findFirst({ where: eq(comunas.id, comunaId) });
  if (!comuna) throw new Error("La comuna elegida no existe.");
  return comuna;
}

async function datosOferta(datos: DatosOferta) {
  const comuna = await comunaExistente(datos.comunaId);
  const roles = datos.roles?.length ? [...new Set(datos.roles)] : (["persona"] as RolActor[]);
  const categoriaIds = await filtrarActividades([...new Set(datos.categoriaIds ?? [])]);
  const otras = (datos.otrasActividades ?? []).map((t) => t.trim()).filter((t) => t.length >= 3);
  const telefono = datos.telefono?.trim()
    ? normalizarTelefono(await prefijoTelefonico(comuna?.id), datos.telefono)
    : null;
  return { comuna, roles, categoriaIds, otras, telefono };
}

/**
 * R1 · Alta e identidad.
 * Una identidad, varios roles: nunca se crean cuentas distintas para el mismo
 * usuario que además vende, produce o presta servicios. Lo mínimo es nombre y
 * RUT; el resto se completa cuando una acción lo pide.
 */
export async function crearPerfil(
  entrada: DatosOferta & { usuarioId: string; nombre: string; rut: string },
) {
  const identidad = await revisarAlta(entrada);
  const { comuna, roles, categoriaIds, otras, telefono } = await datosOferta(entrada);
  if (ofreceAlgo(roles)) {
    exigirRequisitos("ofrecer", {
      comunaId: comuna?.id ?? null,
      telefono,
      identificadorFiscalNorm: identidad.identificadorFiscalNorm,
      actividades: categoriaIds.length + otras.length,
    });
  }

  const slug = await slugLibre(identidad.nombre);

  const perfil = await db
    .transaction(async (tx) => {
      const [creado] = await tx
        .insert(perfiles)
        .values({
          usuarioId: entrada.usuarioId,
          slug,
          ...identidad,
          tipoIdentidad: esRutDeEmpresa(identidad.identificadorFiscalNorm) ? "empresa" : "persona",
          descripcion: entrada.descripcion?.trim() || null,
          telefono,
          direccion: entrada.direccion?.trim() || null,
          comunaId: comuna?.id ?? null,
          // Si compartió su ubicación real, esa manda. Si no, se parte del
          // centro de la comuna. Sin comuna no hay punto en el mapa.
          lat: entrada.lat ?? comuna?.lat ?? null,
          lng: entrada.lng ?? comuna?.lng ?? null,
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

      if (comuna) {
        await tx
          .insert(coberturas)
          .values({ perfilId: creado.id, comunaId: comuna.id })
          .onConflictDoNothing();
      }
      return creado;
    })
    .catch(traducirDuplicado);

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

/* ── Edición ─────────────────────────────────────────────────────────────── */

/**
 * Edición de la ficha (P03): datos comerciales, roles, actividades y cobertura
 * se guardan juntos. Quien ofrece algo cumple lo que pide «ofrecer»; quien solo
 * busca no tiene nada obligatorio salvo su nombre. El RUT no se edita aquí.
 */
export async function guardarFicha(
  perfilId: number,
  datos: DatosOferta & {
    nombre: string;
    correoPublico?: string | null;
    sitioWeb?: string | null;
    coberturaIds?: number[];
    /** Vuelve a ubicar el perfil en el centro de su comuna. */
    quitarUbicacionExacta?: boolean;
  },
) {
  const nombre = nombreValido(datos.nombre);
  const { comuna, roles, categoriaIds, otras, telefono } = await datosOferta(datos);
  const actual = await db.query.perfiles.findFirst({ where: eq(perfiles.id, perfilId) });
  if (!actual) throw new Error("No encontramos tu perfil.");

  if (ofreceAlgo(roles)) {
    exigirRequisitos("ofrecer", {
      comunaId: comuna?.id ?? null,
      telefono,
      identificadorFiscalNorm: actual.identificadorFiscalNorm,
      actividades: categoriaIds.length + otras.length,
    });
  }

  await actualizarPerfil(perfilId, {
    nombre,
    descripcion: datos.descripcion?.trim() || null,
    telefono,
    correoPublico: datos.correoPublico?.trim() || null,
    sitioWeb: datos.sitioWeb?.trim() || null,
    direccion: datos.direccion?.trim() || null,
    comunaId: comuna?.id ?? null,
    radioKm: datos.radioKm ?? null,
    lat: datos.quitarUbicacionExacta ? null : (datos.lat ?? null),
    lng: datos.quitarUbicacionExacta ? null : (datos.lng ?? null),
    recentrar: datos.quitarUbicacionExacta,
  });
  await fijarRoles(perfilId, roles);
  await fijarCategorias(perfilId, categoriaIds);
  await fijarActividadesPropias(perfilId, otras);
  await fijarCoberturas(perfilId, [
    ...new Set([...(comuna ? [comuna.id] : []), ...(datos.coberturaIds ?? [])]),
  ]);
}

/**
 * Completa en el momento lo que una acción pidió (S05). Solo toca lo que viene;
 * al terminar, la acción tiene que poder hacerse.
 */
export async function completarDatos(
  perfilId: number,
  accion: AccionConRequisitos,
  datos: {
    rut?: string | null;
    comunaId?: number | null;
    telefono?: string | null;
    categoriaIds?: number[];
    otrasActividades?: string[];
  },
) {
  const actuales = await datosParaRequisitos(perfilId);
  const faltan = new Set(requisitosPara(accion, actuales).map((r) => r.campo));

  const comuna = faltan.has("comunaId") ? await comunaExistente(datos.comunaId) : null;
  const rut =
    faltan.has("identificadorFiscal") ? await rutDisponible(datos.rut, perfilId) : null;
  const telefono =
    faltan.has("telefono") && datos.telefono?.trim()
      ? normalizarTelefono(
          await prefijoTelefonico(comuna?.id ?? actuales.comunaId),
          datos.telefono,
        )
      : null;
  const categoriaIds = faltan.has("actividad")
    ? await filtrarActividades([...new Set(datos.categoriaIds ?? [])])
    : [];
  const otras = faltan.has("actividad")
    ? (datos.otrasActividades ?? []).map((t) => t.trim()).filter((t) => t.length >= 3)
    : [];

  // Se exige antes de escribir: o queda todo lo que la acción necesita, o nada.
  exigirRequisitos(accion, {
    comunaId: comuna?.id ?? actuales.comunaId,
    telefono: telefono ?? actuales.telefono,
    identificadorFiscalNorm: rut?.identificadorFiscalNorm ?? actuales.identificadorFiscalNorm,
    actividades: actuales.actividades + categoriaIds.length + otras.length,
  });

  await db
    .transaction(async (tx) => {
      const cambios: Partial<typeof perfiles.$inferInsert> = { actualizadoEn: new Date() };
      if (rut) {
        Object.assign(cambios, rut, {
          tipoIdentidad: esRutDeEmpresa(rut.identificadorFiscalNorm) ? "empresa" : "persona",
        });
      }
      if (telefono) cambios.telefono = telefono;
      if (comuna) {
        Object.assign(cambios, { comunaId: comuna.id, lat: comuna.lat, lng: comuna.lng });
        await tx
          .insert(coberturas)
          .values({ perfilId, comunaId: comuna.id })
          .onConflictDoNothing();
      }
      await tx.update(perfiles).set(cambios).where(eq(perfiles.id, perfilId));
      if (categoriaIds.length) {
        await tx
          .insert(perfilCategorias)
          .values(categoriaIds.map((categoriaId, i) => ({ perfilId, categoriaId, principal: i === 0 })))
          .onConflictDoNothing();
      }
    })
    .catch(traducirDuplicado);
  for (const texto of otras) await solicitarCategoria({ perfilId, texto });

  await registrarEvento({
    tipo: "perfil.datos_completados",
    entidad: "perfil",
    entidadId: perfilId,
    actorPerfilId: perfilId,
    datos: { accion, campos: [...faltan] },
  });

  if (accion === "ofrecer") await activarOferta(perfilId);
}

/**
 * Activa el perfil de oferta según lo que declaró: servicios → prestador,
 * productos → comercio. No quita roles ni crea otra cuenta (P06, S22). Quien ya
 * ofrece algo queda igual.
 */
export async function activarOferta(perfilId: number) {
  const roles = await db
    .select({ rol: perfilRoles.rol })
    .from(perfilRoles)
    .where(and(eq(perfilRoles.perfilId, perfilId), eq(perfilRoles.activo, true)));
  if (ofreceAlgo(roles.map((r) => r.rol))) return;

  const tipos = await db
    .select({ tipo: categorias.tipo })
    .from(perfilCategorias)
    .innerJoin(categorias, eq(categorias.id, perfilCategorias.categoriaId))
    .where(eq(perfilCategorias.perfilId, perfilId));

  const nuevos = new Set<RolActor>();
  if (tipos.some((t) => t.tipo !== "producto")) nuevos.add("prestador");
  if (tipos.some((t) => t.tipo !== "servicio")) nuevos.add("negocio");
  // Solo escribió en «Otro»: se parte como prestador y lo cambia en Mi perfil.
  if (!nuevos.size) nuevos.add("prestador");

  await db
    .insert(perfilRoles)
    .values([...nuevos].map((rol) => ({ perfilId, rol, activo: true })))
    .onConflictDoUpdate({
      target: [perfilRoles.perfilId, perfilRoles.rol],
      set: { activo: true },
    });
  await registrarEvento({
    tipo: "perfil.oferta_activada",
    entidad: "perfil",
    entidadId: perfilId,
    actorPerfilId: perfilId,
    datos: { roles: [...nuevos] },
  });
}

/** Lo que miran los requisitos por acción. */
export async function datosParaRequisitos(perfilId: number): Promise<DatosPerfilRequisitos> {
  const [perfil, cats, propias] = await Promise.all([
    db.query.perfiles.findFirst({
      where: eq(perfiles.id, perfilId),
      columns: { comunaId: true, telefono: true, identificadorFiscalNorm: true },
    }),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(perfilCategorias)
      .where(eq(perfilCategorias.perfilId, perfilId)),
    actividadesPropias(perfilId),
  ]);
  return {
    comunaId: perfil?.comunaId ?? null,
    telefono: perfil?.telefono ?? null,
    identificadorFiscalNorm: perfil?.identificadorFiscalNorm ?? null,
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
    /** Coordenadas exactas tomadas con la geolocalización del navegador. */
    lat: number | null;
    lng: number | null;
    /** Volver al centro de la comuna aunque no haya cambiado. */
    recentrar: boolean;
  }>,
) {
  const { lat, lng, recentrar, ...resto } = cambios;
  const valores: Record<string, unknown> = { ...resto, actualizadoEn: new Date() };
  for (const clave of Object.keys(valores)) {
    if (valores[clave] === undefined) delete valores[clave];
  }

  const actual = await db.query.perfiles.findFirst({ where: eq(perfiles.id, perfilId) });
  const cambioComuna = Boolean(cambios.comunaId && actual?.comunaId !== cambios.comunaId);
  const traePunto = lat !== undefined && lat !== null && lng !== undefined && lng !== null;
  // El punto que ya estaba vuelve en el formulario: si cambió la comuna, es viejo.
  const puntoNuevo = traePunto && (actual?.lat !== lat || actual?.lng !== lng);

  if (puntoNuevo) {
    valores.lat = lat;
    valores.lng = lng;
  } else if (cambios.comunaId && (cambioComuna || recentrar)) {
    const comuna = await db.query.comunas.findFirst({ where: eq(comunas.id, cambios.comunaId) });
    if (comuna) {
      valores.lat = comuna.lat;
      valores.lng = comuna.lng;
    }
  } else if (cambios.comunaId === null) {
    valores.lat = null;
    valores.lng = null;
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

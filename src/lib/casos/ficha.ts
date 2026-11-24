import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  calificaciones,
  categorias,
  coberturas,
  comunas,
  items,
  operaciones,
  perfilCategorias,
  perfilRoles,
  perfiles,
  regiones,
  verificaciones,
  type RolActor,
  type TipoIdentidad,
} from "@/db/schema";
import { textoPara } from "@/lib/privacidad";

import { actividadesPropias } from "./categorias";
import { registrarEvento } from "./eventos";
import { imagenesDeItem } from "./imagenes";

/**
 * Proyección pública (D5). Las columnas se nombran una a una: lo que no está
 * en la lista no sale de la base. Teléfono, correo, sitio web, redes, RUT y
 * usuario quedan fuera a propósito; se piden con `contactoDe`.
 */
const COLUMNAS_PUBLICAS = {
  id: perfiles.id,
  slug: perfiles.slug,
  nombre: perfiles.nombre,
  tipoIdentidad: perfiles.tipoIdentidad,
  descripcion: perfiles.descripcion,
  avatarUrl: perfiles.avatarUrl,
  comunaId: perfiles.comunaId,
  comunaNombre: comunas.nombre,
  regionNombre: regiones.nombre,
  direccion: perfiles.direccion,
  lat: perfiles.lat,
  lng: perfiles.lng,
  comunaLat: comunas.lat,
  comunaLng: comunas.lng,
  radioKm: perfiles.radioKm,
  disponibleAhora: perfiles.disponibleAhora,
  reputacionPromedio: perfiles.reputacionPromedio,
  reputacionConteo: perfiles.reputacionConteo,
  creadoEn: perfiles.creadoEn,
};

export type ItemPublico = {
  id: number;
  tipo: "servicio" | "producto" | "ambos";
  nombre: string;
  descripcion: string | null;
  categoriaId: number | null;
  categoriaNombre: string | null;
  precio: string | null;
  moneda: string;
  unidad: string | null;
  imagenUrl: string | null;
};

export type PerfilPublico = {
  id: number;
  slug: string;
  nombre: string;
  tipoIdentidad: TipoIdentidad;
  descripcion: string | null;
  avatarUrl: string | null;
  comunaId: number | null;
  comunaNombre: string | null;
  regionNombre: string | null;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  /** true = la persona fijó su punto; false = es el centro de la comuna. */
  ubicacionExacta: boolean;
  radioKm: number | null;
  disponibleAhora: boolean;
  reputacionPromedio: string | null;
  reputacionConteo: number;
  creadoEn: Date;
  roles: RolActor[];
  categorias: { id: number; nombre: string; slug: string }[];
  otrasActividades: string[];
  cobertura: { id: number; nombre: string }[];
  verificado: boolean;
  catalogo: ItemPublico[];
  resenas: { id: number; puntaje: number; comentario: string | null; creadoEn: Date; autorNombre: string }[];
  operacionesCompletadas: number;
};

/** Un punto es exacto si no coincide con el centroide de su comuna. */
export function esUbicacionExacta(punto: {
  lat: number | null;
  lng: number | null;
  comunaLat: number | null;
  comunaLng: number | null;
}) {
  if (punto.lat === null || punto.lng === null) return false;
  if (punto.comunaLat === null || punto.comunaLng === null) return true;
  return (
    Math.abs(punto.lat - punto.comunaLat) > 1e-6 || Math.abs(punto.lng - punto.comunaLng) > 1e-6
  );
}

const COLUMNAS_ITEM = {
  id: items.id,
  tipo: items.tipo,
  nombre: items.nombre,
  descripcion: items.descripcion,
  categoriaId: items.categoriaId,
  categoriaNombre: categorias.nombre,
  precio: items.precio,
  moneda: items.moneda,
  unidad: items.unidad,
  imagenUrl: items.imagenUrl,
};

/** Ficha que ve cualquiera. Con sesión, los textos libres van completos. */
export async function perfilPublico(
  slug: string,
  conSesion: boolean,
): Promise<PerfilPublico | null> {
  const [fila] = await db
    .select(COLUMNAS_PUBLICAS)
    .from(perfiles)
    .leftJoin(comunas, eq(comunas.id, perfiles.comunaId))
    .leftJoin(regiones, eq(regiones.id, comunas.regionId))
    .where(eq(perfiles.slug, slug))
    .limit(1);
  if (!fila) return null;

  const { comunaLat, comunaLng, ...perfil } = fila;

  const [roles, cats, cobertura, verificado, catalogo, resenas, trabajos, propias] =
    await Promise.all([
      db
        .select({ rol: perfilRoles.rol })
        .from(perfilRoles)
        .where(and(eq(perfilRoles.perfilId, perfil.id), eq(perfilRoles.activo, true))),
      db
        .select({ id: categorias.id, nombre: categorias.nombre, slug: categorias.slug })
        .from(perfilCategorias)
        .innerJoin(categorias, eq(categorias.id, perfilCategorias.categoriaId))
        .where(eq(perfilCategorias.perfilId, perfil.id))
        .orderBy(desc(perfilCategorias.principal), categorias.nombre),
      db
        .select({ id: comunas.id, nombre: comunas.nombre })
        .from(coberturas)
        .innerJoin(comunas, eq(comunas.id, coberturas.comunaId))
        .where(eq(coberturas.perfilId, perfil.id)),
      db
        .select({ x: sql`1` })
        .from(verificaciones)
        .where(and(eq(verificaciones.perfilId, perfil.id), eq(verificaciones.estado, "verificado")))
        .limit(1),
      db
        .select(COLUMNAS_ITEM)
        .from(items)
        .leftJoin(categorias, eq(categorias.id, items.categoriaId))
        .where(and(eq(items.perfilId, perfil.id), eq(items.activo, true)))
        .orderBy(desc(items.creadoEn))
        .limit(60),
      db
        .select({
          id: calificaciones.id,
          puntaje: calificaciones.puntaje,
          comentario: calificaciones.comentario,
          creadoEn: calificaciones.creadoEn,
          autorNombre: perfiles.nombre,
        })
        .from(calificaciones)
        .innerJoin(perfiles, eq(perfiles.id, calificaciones.autorPerfilId))
        .where(eq(calificaciones.destinoPerfilId, perfil.id))
        .orderBy(desc(calificaciones.creadoEn))
        .limit(8),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(operaciones)
        .where(eq(operaciones.proveedorPerfilId, perfil.id)),
      actividadesPropias(perfil.id),
    ]);

  return {
    ...perfil,
    nombre: textoPara(perfil.nombre, conSesion),
    descripcion: textoPara(perfil.descripcion, conSesion),
    direccion: textoPara(perfil.direccion, conSesion),
    ubicacionExacta: esUbicacionExacta({ ...perfil, comunaLat, comunaLng }),
    roles: roles.map((r) => r.rol),
    categorias: cats,
    cobertura,
    verificado: verificado.length > 0,
    catalogo: catalogo.map((i) => itemPara(i, conSesion)),
    resenas: resenas.map((r) => ({ ...r, comentario: textoPara(r.comentario, conSesion) })),
    operacionesCompletadas: Number(trabajos[0]?.total ?? 0),
    otrasActividades: propias.map((p) => textoPara(p.texto, conSesion)),
  };
}

function itemPara(item: ItemPublico, conSesion: boolean): ItemPublico {
  return {
    ...item,
    nombre: textoPara(item.nombre, conSesion),
    descripcion: textoPara(item.descripcion, conSesion),
  };
}

/** Detalle público de un producto o servicio del catálogo. */
export async function itemPublico(slug: string, itemId: number, conSesion: boolean) {
  const [fila] = await db
    .select({
      item: COLUMNAS_ITEM,
      perfil: {
        id: perfiles.id,
        slug: perfiles.slug,
        nombre: perfiles.nombre,
        avatarUrl: perfiles.avatarUrl,
        comunaNombre: comunas.nombre,
      },
    })
    .from(items)
    .innerJoin(perfiles, eq(perfiles.id, items.perfilId))
    .leftJoin(comunas, eq(comunas.id, perfiles.comunaId))
    .leftJoin(categorias, eq(categorias.id, items.categoriaId))
    .where(and(eq(items.id, itemId), eq(perfiles.slug, slug), eq(items.activo, true)))
    .limit(1);
  if (!fila) return null;
  return {
    fotos: await imagenesDeItem(itemId),
    item: itemPara(fila.item, conSesion),
    perfil: { ...fila.perfil, nombre: textoPara(fila.perfil.nombre, conSesion) },
  };
}

export type Contacto = {
  telefono: string | null;
  correoPublico: string | null;
  sitioWeb: string | null;
  redes: Record<string, string>;
};

/**
 * Datos de contacto: exigen saber quién los pide. No es una consulta más de la
 * ficha; queda en la traza.
 */
export async function contactoDe(entrada: {
  perfilId: number;
  solicitantePerfilId: number;
}): Promise<Contacto> {
  const [solicitante, [fila]] = await Promise.all([
    db
      .select({ id: perfiles.id })
      .from(perfiles)
      .where(eq(perfiles.id, entrada.solicitantePerfilId))
      .limit(1),
    db
      .select({
        telefono: perfiles.telefono,
        correoPublico: perfiles.correoPublico,
        sitioWeb: perfiles.sitioWeb,
        redes: perfiles.redes,
      })
      .from(perfiles)
      .where(eq(perfiles.id, entrada.perfilId))
      .limit(1),
  ]);
  if (!solicitante.length) throw new Error("Inicia sesión o crea tu cuenta para continuar.");
  if (!fila) throw new Error("Ese perfil ya no existe.");

  if (entrada.perfilId !== entrada.solicitantePerfilId) {
    await registrarEvento({
      tipo: "contacto.consultado",
      entidad: "perfil",
      entidadId: entrada.perfilId,
      actorPerfilId: entrada.solicitantePerfilId,
    });
  }
  return fila;
}

/** Todo lo propio, para editarlo. Solo la persona dueña llega aquí. */
export async function fichaPropia(perfilId: number) {
  const [fila] = await db
    .select({ perfil: perfiles, comunaLat: comunas.lat, comunaLng: comunas.lng })
    .from(perfiles)
    .leftJoin(comunas, eq(comunas.id, perfiles.comunaId))
    .where(eq(perfiles.id, perfilId))
    .limit(1);
  if (!fila) return null;

  const [roles, cats, cobertura, trabajos, propias] = await Promise.all([
    db
      .select({ rol: perfilRoles.rol })
      .from(perfilRoles)
      .where(and(eq(perfilRoles.perfilId, perfilId), eq(perfilRoles.activo, true))),
    db
      .select({ id: perfilCategorias.categoriaId })
      .from(perfilCategorias)
      .where(eq(perfilCategorias.perfilId, perfilId))
      .orderBy(desc(perfilCategorias.principal)),
    db
      .select({ id: coberturas.comunaId })
      .from(coberturas)
      .where(eq(coberturas.perfilId, perfilId)),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(operaciones)
      .where(eq(operaciones.proveedorPerfilId, perfilId)),
    actividadesPropias(perfilId),
  ]);

  return {
    ...fila.perfil,
    ubicacionExacta: esUbicacionExacta({
      lat: fila.perfil.lat,
      lng: fila.perfil.lng,
      comunaLat: fila.comunaLat,
      comunaLng: fila.comunaLng,
    }),
    roles: roles.map((r) => r.rol),
    categoriaIds: cats.map((c) => c.id),
    coberturaIds: cobertura.map((c) => c.id),
    operacionesCompletadas: Number(trabajos[0]?.total ?? 0),
    otrasActividades: propias.map((p) => p.texto),
  };
}

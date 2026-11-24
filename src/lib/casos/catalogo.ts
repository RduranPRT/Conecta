import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { categorias, items } from "@/db/schema";

import { filtrarActividades } from "./categorias";
import { registrarEvento } from "./eventos";
import { activarOferta, datosParaRequisitos } from "./perfil";
import { exigirRequisitos } from "./requisitos";

/**
 * Catálogo: lo que un perfil vende o presta de forma permanente. Se distingue
 * de una publicación, que es un aviso con fecha en el feed. Un ítem aparece en
 * la ficha pública y hace encontrable al perfil por su nombre (ver
 * `buscarActores`).
 */
export type EntradaItem = {
  tipo: "producto" | "servicio";
  nombre: string;
  descripcion?: string | null;
  categoriaId?: number | null;
  precio?: number | null;
  moneda?: string;
  unidad?: string | null;
  /** En el prototipo la foto es un enlace; la subida de archivos llega después. */
  imagenUrl?: string | null;
};

async function validarItem(entrada: EntradaItem) {
  const nombre = entrada.nombre.trim();
  if (nombre.length < 2) throw new Error("Ponle un nombre a lo que ofreces.");
  if (entrada.tipo !== "producto" && entrada.tipo !== "servicio") {
    throw new Error("Indica si es un producto o un servicio.");
  }
  if (entrada.precio !== null && entrada.precio !== undefined && entrada.precio < 0) {
    throw new Error("El precio no puede ser negativo.");
  }
  const imagenUrl = entrada.imagenUrl?.trim() || null;
  if (imagenUrl && !/^https?:\/\/\S+$/i.test(imagenUrl)) {
    throw new Error("La foto debe ser un enlace que empiece con http:// o https://.");
  }
  const [categoriaId] = entrada.categoriaId ? await filtrarActividades([entrada.categoriaId]) : [];

  return {
    tipo: entrada.tipo,
    nombre,
    descripcion: entrada.descripcion?.trim() || null,
    categoriaId: categoriaId ?? null,
    precio: entrada.precio != null ? entrada.precio.toString() : null,
    moneda: entrada.moneda ?? "CLP",
    unidad: entrada.unidad?.trim() || null,
    imagenUrl,
  };
}

async function itemPropio(itemId: number, perfilId: number) {
  const item = await db.query.items.findFirst({
    where: and(eq(items.id, itemId), eq(items.perfilId, perfilId)),
  });
  if (!item) throw new Error("Ese producto o servicio no es tuyo o ya no existe.");
  return item;
}

export async function crearItem(perfilId: number, entrada: EntradaItem) {
  exigirRequisitos("publicar_catalogo", await datosParaRequisitos(perfilId));
  await activarOferta(perfilId);
  const valores = await validarItem(entrada);
  const [item] = await db
    .insert(items)
    .values({ perfilId, ...valores })
    .returning();

  await registrarEvento({
    tipo: "catalogo.item_creado",
    entidad: "item",
    entidadId: item.id,
    actorPerfilId: perfilId,
    datos: { tipo: item.tipo, categoriaId: item.categoriaId },
  });
  return item;
}

export async function editarItem(perfilId: number, itemId: number, entrada: EntradaItem) {
  await itemPropio(itemId, perfilId);
  const valores = await validarItem(entrada);
  await db.update(items).set(valores).where(eq(items.id, itemId));

  await registrarEvento({
    tipo: "catalogo.item_editado",
    entidad: "item",
    entidadId: itemId,
    actorPerfilId: perfilId,
  });
}

/** Retirar no borra: el ítem deja de verse y puede volver a publicarse. */
export async function cambiarDisponibilidadItem(perfilId: number, itemId: number, activo: boolean) {
  await itemPropio(itemId, perfilId);
  await db.update(items).set({ activo }).where(eq(items.id, itemId));

  await registrarEvento({
    tipo: activo ? "catalogo.item_publicado" : "catalogo.item_retirado",
    entidad: "item",
    entidadId: itemId,
    actorPerfilId: perfilId,
  });
}

export async function catalogoDe(perfilId: number) {
  return db
    .select({ item: items, categoriaNombre: categorias.nombre })
    .from(items)
    .leftJoin(categorias, eq(categorias.id, items.categoriaId))
    .where(eq(items.perfilId, perfilId))
    .orderBy(desc(items.activo), desc(items.creadoEn));
}

export async function itemDe(perfilId: number, itemId: number) {
  return db.query.items.findFirst({
    where: and(eq(items.id, itemId), eq(items.perfilId, perfilId)),
  });
}

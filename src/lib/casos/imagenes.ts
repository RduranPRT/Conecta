import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { imagenes, items, perfiles, type Imagen } from "@/db/schema";
import { almacenamiento } from "@/lib/almacenamiento";
import { MAXIMO_POR_ITEM, procesarImagen } from "@/lib/imagenes";

import { registrarEvento } from "./eventos";

/**
 * Fotos de perfiles y catálogo. `perfilId` es siempre quien administra: nadie
 * sube, ordena ni borra fotos de otro. El archivo se procesa antes de tocar la
 * base y los objetos viejos se borran después de confirmar.
 */

export type ImagenPublica = {
  id: number;
  url: string;
  miniatura: string;
  ancho: number;
  alto: number;
  esPrincipal: boolean;
};

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function aPublica(i: Imagen): ImagenPublica {
  const a = almacenamiento();
  return {
    id: i.id,
    url: a.urlPublica(i.claveDetalle),
    miniatura: a.urlPublica(i.claveMiniatura),
    ancho: i.ancho,
    alto: i.alto,
    esPrincipal: i.esPrincipal,
  };
}

/** Sin almacenamiento configurado no hay fotos que mostrar, pero nada se cae. */
function publicas(filas: Imagen[]) {
  if (!filas.length) return [];
  try {
    return filas.map(aPublica);
  } catch {
    return [];
  }
}

/** Borra objetos ya sin dueño. Si falla, deja la clave en la traza. */
async function borrarObjetos(perfilId: number, filas: Pick<Imagen, "claveDetalle" | "claveMiniatura">[]) {
  const claves = filas.flatMap((f) => [f.claveDetalle, f.claveMiniatura]);
  if (!claves.length) return;
  try {
    await almacenamiento().eliminar(claves);
  } catch (error) {
    console.error("[Conecta] No se pudieron borrar objetos", claves, error);
    await registrarEvento({
      tipo: "imagen.objeto_huerfano",
      entidad: "imagen",
      actorPerfilId: perfilId,
      datos: { claves },
    });
  }
}

async function subirArchivo(carpeta: string, datos: Buffer) {
  const procesada = await procesarImagen(datos);
  const raiz = `${carpeta}/${randomUUID()}`;
  const claveDetalle = `${raiz}.webp`;
  const claveMiniatura = `${raiz}-mini.webp`;
  const a = almacenamiento();
  await Promise.all([
    a.subir(claveDetalle, procesada.detalle, "image/webp"),
    a.subir(claveMiniatura, procesada.miniatura, "image/webp"),
  ]);
  return { claveDetalle, claveMiniatura, ancho: procesada.ancho, alto: procesada.alto };
}

/** Deja la miniatura principal donde las tarjetas ya la leen. */
async function sincronizarItem(tx: Tx, itemId: number) {
  const [principal] = await tx
    .select()
    .from(imagenes)
    .where(and(eq(imagenes.itemId, itemId), eq(imagenes.esPrincipal, true)))
    .limit(1);
  await tx
    .update(items)
    .set({ imagenUrl: principal ? almacenamiento().urlPublica(principal.claveMiniatura) : null })
    .where(eq(items.id, itemId));
}

/** Bloquea el ítem mientras se cambian sus fotos y confirma que es propio. */
async function itemPropioBloqueado(tx: Tx, perfilId: number, itemId: number) {
  const [item] = await tx
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.perfilId, perfilId)))
    .for("update");
  if (!item) throw new Error("Ese producto o servicio no es tuyo o ya no existe.");
}

/* ── Perfil ──────────────────────────────────────────────────────────────── */

export async function fijarFotoPerfil(perfilId: number, datos: Buffer) {
  const archivo = await subirArchivo(`perfiles/${perfilId}`, datos);
  let anteriores: Imagen[] = [];
  try {
    anteriores = await db.transaction(async (tx) => {
      await tx
        .select({ id: perfiles.id })
        .from(perfiles)
        .where(eq(perfiles.id, perfilId))
        .for("update");
      const viejas = await tx
        .delete(imagenes)
        .where(and(eq(imagenes.perfilId, perfilId), isNull(imagenes.itemId)))
        .returning();
      await tx
        .insert(imagenes)
        .values({ perfilId, autorPerfilId: perfilId, esPrincipal: true, ...archivo });
      await tx
        .update(perfiles)
        .set({
          avatarUrl: almacenamiento().urlPublica(archivo.claveMiniatura),
          actualizadoEn: new Date(),
        })
        .where(eq(perfiles.id, perfilId));
      return viejas;
    });
  } catch (error) {
    await borrarObjetos(perfilId, [archivo]);
    throw error;
  }
  await borrarObjetos(perfilId, anteriores);
  await registrarEvento({
    tipo: anteriores.length ? "perfil.foto_reemplazada" : "perfil.foto_agregada",
    entidad: "perfil",
    entidadId: perfilId,
    actorPerfilId: perfilId,
  });
}

export async function quitarFotoPerfil(perfilId: number) {
  const viejas = await db.transaction(async (tx) => {
    const filas = await tx
      .delete(imagenes)
      .where(and(eq(imagenes.perfilId, perfilId), isNull(imagenes.itemId)))
      .returning();
    await tx.update(perfiles).set({ avatarUrl: null }).where(eq(perfiles.id, perfilId));
    return filas;
  });
  await borrarObjetos(perfilId, viejas);
  await registrarEvento({
    tipo: "perfil.foto_eliminada",
    entidad: "perfil",
    entidadId: perfilId,
    actorPerfilId: perfilId,
  });
}

/* ── Catálogo ────────────────────────────────────────────────────────────── */

export async function imagenesDeItem(itemId: number): Promise<ImagenPublica[]> {
  const filas = await db
    .select()
    .from(imagenes)
    .where(eq(imagenes.itemId, itemId))
    .orderBy(asc(imagenes.orden), asc(imagenes.id));
  return publicas(filas);
}

export async function agregarFotoItem(perfilId: number, itemId: number, datos: Buffer) {
  // Primero lo barato: no se procesa ni se sube algo que se va a rechazar.
  await db.transaction((tx) => itemPropioBloqueado(tx, perfilId, itemId));
  const previas = await db.$count(imagenes, eq(imagenes.itemId, itemId));
  if (previas >= MAXIMO_POR_ITEM) throw new Error(DEMASIADAS);

  const archivo = await subirArchivo(`items/${itemId}`, datos);
  try {
    await db.transaction(async (tx) => {
      await itemPropioBloqueado(tx, perfilId, itemId);
      const actuales = await tx
        .select({ orden: imagenes.orden })
        .from(imagenes)
        .where(eq(imagenes.itemId, itemId));
      if (actuales.length >= MAXIMO_POR_ITEM) throw new Error(DEMASIADAS);
      await tx.insert(imagenes).values({
        perfilId,
        itemId,
        autorPerfilId: perfilId,
        orden: Math.max(-1, ...actuales.map((a) => a.orden)) + 1,
        esPrincipal: actuales.length === 0,
        ...archivo,
      });
      await sincronizarItem(tx, itemId);
    });
  } catch (error) {
    await borrarObjetos(perfilId, [archivo]);
    throw error;
  }
  await registrarEvento({
    tipo: "catalogo.foto_agregada",
    entidad: "item",
    entidadId: itemId,
    actorPerfilId: perfilId,
  });
}

const DEMASIADAS =
  "Ya tiene 5 fotos, que es el máximo (1 principal y 4 adicionales). Elimina una para agregar otra.";

async function imagenPropia(tx: Tx, perfilId: number, imagenId: number) {
  const [imagen] = await tx
    .select()
    .from(imagenes)
    .where(and(eq(imagenes.id, imagenId), eq(imagenes.perfilId, perfilId)))
    .limit(1);
  if (!imagen?.itemId) throw new Error("Esa foto no es tuya o ya no existe.");
  await itemPropioBloqueado(tx, perfilId, imagen.itemId);
  return { ...imagen, itemId: imagen.itemId };
}

export async function marcarPrincipal(perfilId: number, imagenId: number) {
  await db.transaction(async (tx) => {
    const imagen = await imagenPropia(tx, perfilId, imagenId);
    await tx
      .update(imagenes)
      .set({ esPrincipal: false })
      .where(eq(imagenes.itemId, imagen.itemId));
    await tx.update(imagenes).set({ esPrincipal: true }).where(eq(imagenes.id, imagenId));
    await sincronizarItem(tx, imagen.itemId);
  });
}

/** Mueve una foto un lugar hacia el inicio (−1) o hacia el final (+1). */
export async function moverFoto(perfilId: number, imagenId: number, sentido: -1 | 1) {
  await db.transaction(async (tx) => {
    const imagen = await imagenPropia(tx, perfilId, imagenId);
    const todas = await tx
      .select({ id: imagenes.id })
      .from(imagenes)
      .where(eq(imagenes.itemId, imagen.itemId))
      .orderBy(asc(imagenes.orden), asc(imagenes.id));
    const desde = todas.findIndex((t) => t.id === imagenId);
    const hasta = desde + sentido;
    if (hasta < 0 || hasta >= todas.length) return;
    [todas[desde], todas[hasta]] = [todas[hasta], todas[desde]];
    for (const [orden, t] of todas.entries()) {
      await tx.update(imagenes).set({ orden }).where(eq(imagenes.id, t.id));
    }
  });
}

export async function eliminarFotoItem(perfilId: number, imagenId: number) {
  const borrada = await db.transaction(async (tx) => {
    const imagen = await imagenPropia(tx, perfilId, imagenId);
    await tx.delete(imagenes).where(eq(imagenes.id, imagenId));
    if (imagen.esPrincipal) {
      const [siguiente] = await tx
        .select({ id: imagenes.id })
        .from(imagenes)
        .where(eq(imagenes.itemId, imagen.itemId))
        .orderBy(asc(imagenes.orden), asc(imagenes.id))
        .limit(1);
      if (siguiente) {
        await tx.update(imagenes).set({ esPrincipal: true }).where(eq(imagenes.id, siguiente.id));
      }
    }
    await sincronizarItem(tx, imagen.itemId);
    return imagen;
  });
  await borrarObjetos(perfilId, [borrada]);
  await registrarEvento({
    tipo: "catalogo.foto_eliminada",
    entidad: "item",
    entidadId: borrada.itemId,
    actorPerfilId: perfilId,
  });
}

/** Elimina un producto o servicio con todas sus fotos. No se puede deshacer. */
export async function eliminarItem(perfilId: number, itemId: number) {
  const fotos = await db.transaction(async (tx) => {
    await itemPropioBloqueado(tx, perfilId, itemId);
    const filas = await tx.delete(imagenes).where(eq(imagenes.itemId, itemId)).returning();
    await tx.delete(items).where(eq(items.id, itemId));
    return filas;
  });
  await borrarObjetos(perfilId, fotos);
  await registrarEvento({
    tipo: "catalogo.item_eliminado",
    entidad: "item",
    entidadId: itemId,
    actorPerfilId: perfilId,
    datos: { fotos: fotos.length },
  });
}

/** Cuántas fotos tiene cada ítem, para la lista del catálogo. */
export async function conteoFotos(itemIds: number[]) {
  if (!itemIds.length) return new Map<number, number>();
  const filas = await db
    .select({ itemId: imagenes.itemId })
    .from(imagenes)
    .where(inArray(imagenes.itemId, itemIds));
  const mapa = new Map<number, number>();
  for (const f of filas) mapa.set(f.itemId!, (mapa.get(f.itemId!) ?? 0) + 1);
  return mapa;
}

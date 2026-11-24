import { expect, test } from "@playwright/test";
import { eq, sql } from "drizzle-orm";
import sharp from "sharp";

import { db } from "@/db";
import { items, perfiles } from "@/db/schema";
import { crearItem } from "@/lib/casos/catalogo";
import { contactoDe } from "@/lib/casos/ficha";
import * as fotos from "@/lib/casos/imagenes";
import { enviarPropuesta } from "@/lib/casos/propuestas";

import { ALMACEN_E2E, BASE_E2E } from "./entorno";

/**
 * Reglas que una pantalla no deja intentar, probadas contra los casos de uso y
 * la base e2e: es lo que haría un agente, o alguien llamando a la acción a mano.
 */
process.env.DATABASE_URL = BASE_E2E;
process.env.STORAGE_DRIVER = "local";
process.env.ALMACEN_LOCAL_DIR = ALMACEN_E2E;

const foto = () =>
  sharp({ create: { width: 300, height: 300, channels: 3, background: "#336699" } }).jpeg().toBuffer();

async function contexto() {
  const perfil = async (slug: string) =>
    (await db.query.perfiles.findFirst({ where: eq(perfiles.slug, slug) }))!;
  const ana = await perfil("ana-rojas-abogada");
  const otro = await perfil("pedro-soto-electricista");
  const item = (await db.query.items.findFirst({
    where: eq(items.perfilId, ana.id),
    orderBy: items.id,
  }))!;
  return { ana, otro, item };
}

test("nadie sube, ordena, marca ni borra fotos de otro", async () => {
  const { ana, otro, item } = await contexto();
  await expect(fotos.agregarFotoItem(otro.id, item.id, await foto())).rejects.toThrow(/no es tuyo/);
  await fotos.agregarFotoItem(ana.id, item.id, await foto());
  const [imagen] = await fotos.imagenesDeItem(item.id);
  for (const intento of [
    () => fotos.eliminarFotoItem(otro.id, imagen.id),
    () => fotos.marcarPrincipal(otro.id, imagen.id),
    () => fotos.moverFoto(otro.id, imagen.id, 1),
    () => fotos.eliminarItem(otro.id, item.id),
  ]) {
    await expect(intento()).rejects.toThrow(/no es tuy/);
  }
  expect(await fotos.imagenesDeItem(item.id)).toHaveLength(1);
});

test("la sexta foto se rechaza aunque lleguen varias a la vez", async () => {
  const { ana, item } = await contexto();
  const datos = await foto();
  const previas = (await fotos.imagenesDeItem(item.id)).length;
  const r = await Promise.allSettled(
    Array.from({ length: 8 }, () => fotos.agregarFotoItem(ana.id, item.id, datos)),
  );
  const rechazos = r.filter((x) => x.status === "rejected") as PromiseRejectedResult[];
  const finales = await fotos.imagenesDeItem(item.id);
  expect(finales).toHaveLength(5);
  expect(finales.filter((f) => f.esPrincipal)).toHaveLength(1);
  expect(rechazos).toHaveLength(8 - (5 - previas));
  expect(rechazos[0].reason.message).toMatch(/5 fotos, que es el máximo/);
});

test("el contacto exige saber quién lo pide y deja traza", async () => {
  const { ana, otro } = await contexto();
  await expect(contactoDe({ perfilId: ana.id, solicitantePerfilId: 999999 })).rejects.toThrow(
    /Inicia sesión/,
  );
  expect((await contactoDe({ perfilId: ana.id, solicitantePerfilId: otro.id })).telefono).toBe(
    "+56961002001",
  );
  const [fila] = await db.execute<{ total: number }>(
    sql`select count(*)::int as total from eventos where tipo = 'contacto.consultado' and actor_perfil_id = ${otro.id}`,
  );
  expect(Number(fila.total)).toBeGreaterThan(0);
});

test("cotizar y publicar exigen los datos de «Ofrecer», también por fuera de la pantalla", async () => {
  const camila = (await db.query.perfiles.findFirst({ where: eq(perfiles.slug, "camila-torres") }))!;
  await expect(
    enviarPropuesta({ necesidadId: 5, perfilId: camila.id, monto: 1000, plazoDias: 1 }),
  ).rejects.toThrow(/Qué ofreces.*Teléfono/);
  await expect(crearItem(camila.id, { tipo: "producto", nombre: "Algo" })).rejects.toThrow(
    /Antes de continuar falta/,
  );
});

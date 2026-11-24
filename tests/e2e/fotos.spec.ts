import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

import { ingresar, salir } from "./ayudas";
import { ALMACEN_E2E } from "./entorno";

const foto = async (nombre: string, color: string) => ({
  name: nombre,
  mimeType: "image/jpeg",
  buffer: await sharp({ create: { width: 1200, height: 900, channels: 3, background: color } })
    .jpeg()
    .toBuffer(),
});

/** Archivos que hay ahora en el almacenamiento local. */
function archivos(carpeta: string) {
  const ruta = path.join(ALMACEN_E2E, carpeta);
  if (!existsSync(ruta)) return [];
  return readdirSync(ruta, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith(".webp"));
}

async function publicar(page: Page, nombre: string, color: string) {
  await page.goto("/mi-catalogo/nuevo?tipo=producto");
  await page.getByLabel("Nombre").fill(nombre);
  await page.getByLabel("Precio (CLP, opcional)").fill("1800");
  await page.getByRole("combobox").fill(nombre);
  await page.getByRole("option", { name: new RegExp(`^${nombre}`) }).first().click();
  await page.getByRole("button", { name: "Guardar y agregar fotos" }).click();
  await expect(page.getByText(`«${nombre}» ya está en tu catálogo`)).toBeVisible();
  await page.getByLabel("Fotos del producto o servicio").setInputFiles(await foto("a.jpg", color));
  await expect(page.getByTestId("foto-item")).toHaveCount(1);
}

test("panadería publica Marraqueta y Hogaza con fotos y un visitante las ve", async ({ page, request }) => {
  await ingresar(page, "panaderia-la-espiga");
  await publicar(page, "Marraqueta", "#c9a063");
  await page.getByLabel("Fotos del producto o servicio").setInputFiles([
    await foto("b.jpg", "#8a5a2b"),
    await foto("c.jpg", "#e8c998"),
  ]);
  await expect(page.getByTestId("foto-item")).toHaveCount(3);
  const idMarraqueta = new URL(page.url()).pathname.split("/").pop()!;
  await publicar(page, "Hogaza", "#7b4a1e");

  await salir(page);
  await page.goto("/p/panaderia-la-espiga");
  for (const nombre of ["Marraqueta", "Hogaza"]) {
    const img = page.locator("#catalogo").getByRole("img", { name: nombre });
    await expect(img).toBeVisible();
    expect(await img.evaluate((i: HTMLImageElement) => i.naturalWidth)).toBe(400);
  }
  await page.locator("#catalogo").getByRole("link", { name: "Marraqueta" }).click();
  const galeria = page.getByTestId("galeria");
  await expect(galeria.getByRole("button")).toHaveCount(3);
  await galeria.getByRole("button", { name: "Ver foto 2 de 3" }).click();
  await expect(galeria.getByRole("button", { name: "Ver foto 2 de 3" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // Lo servido es WebP y no trae metadatos.
  const src = await galeria.getByRole("img", { name: "Marraqueta" }).getAttribute("src");
  const bytes = await (await request.get(src!)).body();
  const meta = await sharp(bytes).metadata();
  expect(meta.format).toBe("webp");
  expect(meta.exif).toBeUndefined();
  expect(archivos(`items/${idMarraqueta}`)).toHaveLength(6);
});

test("ordenar, cambiar la principal, límite de cinco y eliminar", async ({ page }) => {
  await ingresar(page, "repuestos-del-sur");
  await page.goto("/mi-catalogo");
  await page.getByRole("link", { name: /^Filtro de aire/ }).click();
  await page.waitForURL(/\/mi-catalogo\/\d+$/);
  const id = new URL(page.url()).pathname.split("/").pop()!;
  const entrada = page.getByLabel("Fotos del producto o servicio");
  const fotos = page.getByTestId("foto-item");
  const colores = ["#111111", "#222222", "#333333", "#444444", "#555555"];
  await entrada.setInputFiles(await Promise.all(colores.map((c, i) => foto(`${i}.jpg`, c))));
  await expect(fotos).toHaveCount(5);
  await expect(page.getByText("Fotos (5 de 5)")).toBeVisible();
  await expect(fotos.first()).toContainText("Principal");

  // La sexta: la pantalla ya no la ofrece y el servidor la rechaza igual.
  await expect(page.getByRole("button", { name: "Agregar otra" })).toHaveCount(0);
  await entrada.setInputFiles(await foto("6.jpg", "#666666"));
  await expect(page.getByText(/Puedes tener 5 fotos como máximo/)).toBeVisible();

  const segunda = await fotos.nth(1).getByRole("img").getAttribute("src");
  await fotos.nth(1).getByRole("button", { name: "Mover antes" }).click();
  await expect(fotos.first().getByRole("img")).toHaveAttribute("src", segunda!);
  await fotos.first().getByRole("button", { name: "Marcar como principal" }).click();
  await expect(fotos.first()).toContainText("Principal");
  await expect(page.getByText("Principal", { exact: true })).toHaveCount(1);

  expect(archivos(`items/${id}`)).toHaveLength(10);
  await fotos.first().getByRole("button", { name: "Eliminar foto" }).click();
  await expect(fotos).toHaveCount(4);
  // La siguiente pasa a ser la principal y el objeto ya no existe.
  await expect(page.getByText("Principal", { exact: true })).toHaveCount(1);
  expect(archivos(`items/${id}`)).toHaveLength(8);
  expect((await page.request.get(segunda!)).status()).toBe(404);

  await page.getByRole("button", { name: "Eliminar de mi catálogo" }).click();
  await page.getByRole("button", { name: "Sí, eliminar" }).click();
  await expect(page).toHaveURL(/\/mi-catalogo$/);
  await expect(page.getByRole("link", { name: /^Filtro de aire/ })).toHaveCount(0);
  expect(archivos(`items/${id}`)).toHaveLength(0);
});

test("gasfíter: su foto aparece junto a su nombre y especialidad; reemplazar borra la anterior", async ({
  page,
}) => {
  await ingresar(page, "salinas-gasfiteria-24h");
  await page.goto("/mi-perfil");
  const entrada = page.getByLabel("Foto de perfil");

  await entrada.setInputFiles({
    name: "virus.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.concat([Buffer.from("MZ"), Buffer.alloc(4000, 1)]),
  });
  await expect(page.getByText("Ese archivo no es una foto. Usa JPG, PNG o WebP.")).toBeVisible();
  await entrada.setInputFiles({
    name: "grande.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.alloc(6 * 1024 * 1024, 0xff),
  });
  await expect(page.getByText("La foto pesa más de 5 MB.")).toBeVisible();

  await entrada.setInputFiles(await foto("yo.jpg", "#2b6cb0"));
  await expect(page.getByRole("button", { name: "Cambiar foto" })).toBeVisible();
  const primera = await page.locator("main").getByRole("img", { name: "Salinas Gasfitería 24h" }).getAttribute("src");
  const carpeta = primera!.replace("/api/archivos/", "").split("/").slice(0, 2).join("/");
  expect(archivos(carpeta)).toHaveLength(2);

  await entrada.setInputFiles(await foto("yo2.jpg", "#276749"));
  await expect(
    page.locator("main").getByRole("img", { name: "Salinas Gasfitería 24h" }),
  ).not.toHaveAttribute("src", primera!);
  expect(archivos(carpeta)).toHaveLength(2);
  expect((await page.request.get(primera!)).status()).toBe(404);

  await salir(page);
  await page.goto("/buscar?q=gasfiter");
  const tarjeta = page.getByTestId("resultados").locator("article").filter({ hasText: "Salinas Gasfitería 24h" });
  await expect(tarjeta.getByRole("img", { name: "Salinas Gasfitería 24h" })).toBeVisible();
  await expect(tarjeta.getByText("Gasfitería", { exact: true })).toBeVisible();

  await ingresar(page, "salinas-gasfiteria-24h");
  await page.goto("/mi-perfil");
  await page.getByRole("button", { name: "Eliminar foto" }).click();
  await expect(page.getByRole("button", { name: "Agregar foto" })).toBeVisible();
  expect(archivos(carpeta)).toHaveLength(0);
});


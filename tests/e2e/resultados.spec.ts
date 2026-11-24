import { expect, test } from "@playwright/test";

import { visibleSinScroll } from "./ayudas";

const BUSQUEDAS = [
  "/buscar?q=gasfiter",
  "/buscar?q=" + encodeURIComponent("necesito un electricista que pueda venir hoy cerca de mi casa"),
  "/buscar?q=repuestos&rol=proveedor",
  // Con aviso de «no hay aquí», que ocupa más.
  "/buscar?q=gasfiter+en+Putre",
];

for (const ruta of BUSQUEDAS) {
  test(`la primera tarjeta se ve sin scroll en ${decodeURIComponent(ruta)}`, async ({ page }) => {
    await page.goto(ruta);
    const { caja } = await visibleSinScroll(page, page.getByTestId("resultados").locator("article").first());
    const barra = (await page.locator("nav").last().boundingBox())!;
    expect(caja.y + caja.height).toBeLessThanOrEqual(barra.y);
    // Nada se sale hacia el lado en el celular.
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(ancho).toBeLessThanOrEqual(390);
  });
}

test("con resultados no hay textos explicativos; el mapa sigue a un toque", async ({ page }) => {
  await page.goto("/buscar?q=gasfiter");
  await expect(page.getByText("Una palabra («gasfíter»)")).toHaveCount(0);
  await page.getByRole("link", { name: "Ver mapa" }).click();
  await expect(page.getByRole("application", { name: /Mapa/ })).toBeVisible();
  await page.getByRole("link", { name: "Ver lista" }).click();
  await expect(page.getByTestId("resultados")).toBeVisible();
});

for (const ruta of ["/", "/explorar", "/explorar/rubro-hogar", "/mapa", "/p/repuestos-del-sur", "/registro", "/descubrir"]) {
  test(`nada se sale hacia el lado en ${ruta}`, async ({ page }) => {
    await page.goto(ruta);
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
}

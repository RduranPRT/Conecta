import { expect, test } from "@playwright/test";

import { visibleSinScroll } from "./ayudas";
import { CLAVE_DEMO } from "./entorno";

test.describe("visitante sin cuenta", () => {
  test("Inicio: buscador sin scroll y qué es Conecta", async ({ page }) => {
    await page.goto("/");
    const { caja, alto } = await visibleSinScroll(page, page.getByRole("search").first());
    expect(caja.y + caja.height).toBeLessThan(alto / 2);
    await expect(page.getByRole("heading", { name: "¿Qué es Conecta?" })).toBeVisible();
    const barra = page.locator("nav").last();
    await expect(barra.getByRole("link")).toHaveText(["Inicio", "Mapa", "Mi Conecta"]);
  });

  test("busca, abre un perfil y su catálogo, y ve el mapa", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("search").getByRole("textbox").fill("electricista");
    await page.getByRole("search").getByRole("button").click();
    await expect(page).toHaveURL(/\/buscar\?q=electricista/);
    await page.getByRole("link", { name: "Pedro Soto · Electricista" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Pedro Soto");
    await page.locator("#catalogo").getByRole("link", { name: "Instalación de tablero eléctrico" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Instalación de tablero eléctrico",
    );
    await page.goto("/mapa");
    await expect(page.getByRole("application", { name: /Mapa/ })).toBeVisible();
  });

  test("contactar pide sesión y vuelve al mismo perfil con el contacto", async ({ page }) => {
    await page.goto("/p/gasfiteria-aguasur");
    await page.getByRole("link", { name: "Contactar", exact: true }).first().click();
    await expect(
      page.getByRole("dialog").getByText("Inicia sesión o crea tu cuenta para continuar"),
    ).toBeVisible();
    await page.getByRole("dialog").getByRole("link", { name: "Ya tengo cuenta" }).click();
    await page.getByLabel("Correo").fill("camila-torres@conecta.demo");
    await page.getByLabel("Contraseña").fill(CLAVE_DEMO);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/p\/gasfiteria-aguasur\?accion=contactar/);
    await expect(page.getByTestId("datos-contacto")).toContainText("+56 9 5555 1010");
    await expect(page.getByLabel("Mensaje para Gasfitería Aguasur")).toBeFocused();
  });

  test("guardar desde resultados vuelve a la misma búsqueda", async ({ page }) => {
    await page.goto("/descubrir?tipo=producto&zona=todo");
    await page.getByRole("link", { name: "Guardar" }).first().click();
    await page.getByRole("dialog").getByRole("link", { name: "Ya tengo cuenta" }).click();
    await page.getByLabel("Correo").fill("camila-torres@conecta.demo");
    await page.getByLabel("Contraseña").fill(CLAVE_DEMO);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/descubrir\?tipo=producto&zona=todo$/);
    await expect(page.locator("article").first()).toBeInViewport();
    await page.getByRole("button", { name: "Guardar" }).first().click();
    await expect(page.getByRole("button", { name: "Quitar de guardados" }).first()).toBeVisible();
  });

  for (const next of ["https://externo.com", "//externo.com", "/%5Cexterno.com"]) {
    test(`next=${next} no saca a nadie del sitio`, async ({ page, baseURL }) => {
      await page.goto(`/ingresar?next=${encodeURIComponent(next)}`);
      await page.getByLabel("Correo").fill("camila-torres@conecta.demo");
      await page.getByLabel("Contraseña").fill(CLAVE_DEMO);
      await page.getByRole("button", { name: "Ingresar" }).click();
      await page.waitForURL((u) => !u.pathname.startsWith("/ingresar"));
      expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin);
    });
  }

  test("una ruta privada pide sesión y conserva el retorno", async ({ page }) => {
    await page.goto("/publicar?tipo=oferta");
    await expect(page).toHaveURL(/\/ingresar\?next=%2Fpublicar%3Ftipo%3Doferta/);
    await page.goto("/mi-conecta");
    await expect(page).toHaveURL(/\/ingresar\?next=%2Fmi-conecta/);
  });

  test("las tarjetas dicen Ofrece o Busca", async ({ page }) => {
    await page.goto("/descubrir?zona=todo");
    await expect(page.locator("article").getByText("Ofrece", { exact: true }).first()).toBeVisible();
    await expect(page.locator("article").getByText("Busca", { exact: true }).first()).toBeVisible();
  });
});

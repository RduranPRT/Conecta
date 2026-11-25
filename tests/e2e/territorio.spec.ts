import { expect, test } from "@playwright/test";

test.describe("territorio explorado", () => {
  test("se ve en Inicio, se cambia escribiendo sin tildes y se recuerda", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Explorando: Ñuñoa, RM · Cambiar")).toBeVisible();

    await page.getByText("Cambiar").click();
    await page.getByRole("combobox").fill("chillan");
    await page.getByRole("option", { name: /^Chillán ·/ }).click();
    await page.getByRole("button", { name: "Explorar aquí" }).click();
    await expect(page.getByText("Explorando: Chillán, Ñuble · Cambiar")).toBeVisible();

    await page.goto("/mapa");
    await expect(page.getByText("Explorando: Chillán, Ñuble · Cambiar")).toBeVisible();
    await page.goto("/buscar?q=gasfiter");
    await expect(page.getByText("Explorando: Chillán, Ñuble · Cambiar")).toBeVisible();
    await expect(page.getByText("Todavía no hay oferta en Chillán")).toBeVisible();
    await expect(page.getByTestId("resultados").locator("article").first()).toBeVisible();

    await page.getByText("Cambiar").click();
    await page.getByRole("button", { name: "Ver todo Chile" }).click();
    await expect(page.getByText("Explorando: todo Chile · Cambiar")).toBeVisible();
  });

  test("en una comuna sin oferta se dice explícitamente", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Cambiar").click();
    await page.getByRole("combobox").fill("puerto williams");
    await page.getByRole("option", { name: /^Cabo de Hornos/ }).click();
    await page.getByRole("button", { name: "Explorar aquí" }).click();
    await expect(page.getByText("Todavía no hay oferta publicada en Cabo de Hornos")).toBeVisible();
  });
});

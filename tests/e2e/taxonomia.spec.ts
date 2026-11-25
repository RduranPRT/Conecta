import { expect, test, type Page } from "@playwright/test";

import { ingresar, salir } from "./ayudas";

async function aparece(page: Page, ruta: string, nombre: string) {
  await page.goto(ruta);
  await expect(
    page.getByTestId("resultados").getByRole("link", { name: nombre, exact: true }),
    `${nombre} en ${ruta}`,
  ).toBeVisible();
}

test.describe("quién aparece (comprobaciones de cierre de C01–C06)", () => {
  test("abogada con asesoría en contratos", async ({ page }) => {
    for (const q of ["abogado", "contrato", "revisar un contrato"]) {
      await aparece(page, `/buscar?q=${encodeURIComponent(q)}`, "Ana Rojas · Abogada");
    }
    await page.goto("/explorar/rubro-profesionales");
    await page.getByText("Asesoría legal", { exact: true }).click();
    await page.getByRole("link", { name: /^Asesoría en contratos/ }).click();
    await expect(
      page.getByTestId("resultados").getByRole("link", { name: "Ana Rojas · Abogada", exact: true }),
    ).toBeVisible();
  });

  test("electricista con varias reparaciones", async ({ page }) => {
    for (const q of ["electricista", "enchufe", "tablero eléctrico", "cámaras de seguridad"]) {
      await aparece(page, `/buscar?q=${encodeURIComponent(q)}`, "Pedro Soto · Electricista");
    }
  });

  test("panadería sin oficio", async ({ page }) => {
    for (const q of ["pan", "marraqueta"]) {
      await aparece(page, `/buscar?q=${q}`, "Panadería La Espiga");
    }
  });

  test("audiovisual con varias especialidades", async ({ page }) => {
    for (const q of ["fotógrafo", "video", "dron"]) {
      await aparece(page, `/buscar?q=${encodeURIComponent(q)}`, "Lumen Audiovisual");
    }
  });

  test("tienda de repuestos por rubro, producto, rol y comuna", async ({ page }) => {
    for (const ruta of [
      "/buscar?q=pastillas+de+freno",
      "/buscar?q=repuestos+en+Rancagua",
      "/buscar?q=repuestos&rol=proveedor",
      "/buscar?q=repuestos&rol=negocio",
    ]) {
      await aparece(page, ruta, "Repuestos del Sur");
    }
    await page.goto("/explorar/rubro-vehiculos");
    await page.getByText("Repuestos automotrices", { exact: true }).click();
    await page.getByRole("link", { name: "Ver todo Repuestos automotrices" }).click();
    await expect(
      page.getByTestId("resultados").getByRole("link", { name: "Repuestos del Sur", exact: true }),
    ).toBeVisible();
  });
});

test.describe("reconocer no es lo mismo que tener oferta (S12)", () => {
  test("la categoría existe y nadie la ofrece", async ({ page }) => {
    await page.goto("/buscar?q=acupuntura");
    await expect(page.getByText(/«Acupuntura» sí existe en Conecta/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Publicar como necesidad" })).toBeVisible();
  });

  test("no se reconoce y se sugiere lo parecido", async ({ page }) => {
    await page.goto("/buscar?q=electrisista");
    await expect(page.getByText("No reconocemos esa búsqueda")).toBeVisible();
    await expect(page.getByText("¿Quisiste decir?")).toBeVisible();
    await expect(page.getByRole("link", { name: /Electricista/ })).toBeVisible();
  });
});

test("«Otro»: es buscable, entra a la cola y al aprobarlo el perfil queda bajo el ítem nuevo", async ({
  page,
}) => {
  await aparece(page, "/buscar?q=dom%C3%B3tica", "Pedro Soto · Electricista");

  await ingresar(page, "rodrigo-fuentes");
  await page.goto("/centro-de-control");
  const solicitud = page
    .getByTestId("solicitud-otro")
    .filter({ hasText: "Domótica y casas inteligentes" });
  await solicitud.getByRole("combobox").last().fill("electricidad");
  await page.getByRole("option", { name: /^Todo Electricidad ·/ }).click();
  await solicitud.getByRole("button", { name: "Resolver" }).click();
  await expect(page.getByText("Domótica y casas inteligentes").first()).toBeHidden();
  await salir(page);

  await page.goto("/buscar?q=domotica+y+casas+inteligentes");
  await expect(page.getByRole("link", { name: "Domótica y casas inteligentes" })).toBeVisible();
  await page.getByRole("link", { name: "Pedro Soto · Electricista", exact: true }).click();
  await expect(page.getByRole("link", { name: "Domótica y casas inteligentes" })).toBeVisible();

  await page.goto("/explorar/rubro-hogar");
  await page.getByText("Electricidad", { exact: true }).click();
  await expect(page.getByRole("link", { name: /^Domótica y casas inteligentes/ })).toContainText(
    "perfil",
  );
});

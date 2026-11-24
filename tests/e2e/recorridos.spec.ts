import { expect, test } from "@playwright/test";
import sharp from "sharp";

import { elegirComuna, registrar, salir } from "./ayudas";
import { CLAVE_DEMO } from "./entorno";

test("R1–R6: alta, necesidad, oportunidad, cotización, adjudicación y calificación mutua", async ({
  browser,
}) => {
  test.setTimeout(90_000);
  const celular = { viewport: { width: 390, height: 844 } };
  const compradora = await (await browser.newContext(celular)).newPage();
  const tecnico = await (await browser.newContext(celular)).newPage();

  // R1 · Alta de los dos.
  await registrar(tecnico, { nombre: "Tito Lavadoras" });
  await tecnico.goto("/completar?accion=ofrecer&next=/");
  await elegirComuna(tecnico, "vitacura", "Vitacura");
  await tecnico.getByLabel("Buscar actividad").fill("lavadoras");
  await tecnico.getByRole("button", { name: /^Reparación de lavadoras/ }).click();
  await tecnico.getByLabel("Teléfono").fill("9 7777 1234");
  await tecnico.getByRole("button", { name: "Guardar y aparecer en Conecta" }).click();
  await expect(tecnico).toHaveURL((u) => u.pathname === "/");

  await registrar(compradora, { nombre: "Berta Compradora" });
  await compradora.waitForURL(/\/bienvenida/);

  // R2 · Publicar la necesidad: solo falta la comuna, y va en el formulario.
  await compradora.goto("/publicar?tipo=necesidad");
  await compradora.getByLabel("¿Qué necesitas?").fill("Reparar lavadora que no bota el agua");
  await compradora
    .getByLabel("Cuéntalo con tus palabras")
    .fill("Es de carga frontal, lava pero no desagua. Atiendo en la tarde.");
  await elegirComuna(compradora, "vitacura", "Vitacura");
  await compradora.getByRole("button", { name: "Publicar y buscar quién puede" }).click();
  await compradora.waitForURL(/\/necesidades\/\d+/);
  const necesidad = new URL(compradora.url()).pathname;
  await expect(compradora.getByText("Reparación de lavadoras").first()).toBeVisible();

  // R3 · Le llega como oportunidad al técnico.
  await tecnico.goto("/");
  await tecnico.getByRole("link", { name: /Reparar lavadora que no bota el agua/ }).first().click();
  await expect(tecnico.getByText(/Te llegó como oportunidad automática/)).toBeVisible();

  // R4 · Cotiza. No se le vuelve a pedir nada.
  await expect(tecnico.getByTestId("completar-datos")).toHaveCount(0);
  await tecnico.getByLabel(/^Monto/).fill("35000");
  await tecnico.getByLabel("Qué incluye tu propuesta").fill("Visita y cambio de bomba.");
  await tecnico.getByRole("button", { name: "Enviar propuesta" }).click();
  await expect(tecnico.getByText("Propuesta enviada.")).toBeVisible();

  // R5 · Compara y adjudica.
  await compradora.goto(necesidad);
  await expect(compradora.getByText("Propuestas recibidas (1)")).toBeVisible();
  await compradora.getByRole("button", { name: "Adjudicar" }).click();
  await expect(compradora.getByText(/Adjudicada por/)).toBeVisible();

  // Entrega y R6 · Calificación mutua.
  await tecnico.goto(necesidad);
  await tecnico.getByRole("button", { name: "Confirmar entrega" }).click();
  for (const pagina of [compradora, tecnico]) {
    await pagina.goto(necesidad);
    await pagina.getByPlaceholder(/Un comentario breve/).fill("Todo bien.");
    await pagina.getByRole("button", { name: "Calificar" }).click();
    await expect(pagina.getByText("Calificación registrada.")).toBeVisible();
  }
  await compradora.goto(necesidad);
  await expect(compradora.getByText("cerrada", { exact: true })).toBeVisible();
  await compradora.context().close();
  await tecnico.context().close();
});

test("empresa: publica en su catálogo con foto, retira, republica y aparece por todas las vías", async ({
  page,
}) => {
  await registrar(page, { nombre: "Frenos Victoria", empresa: true });
  // «Publicar en el catálogo» pide lo que falta en el momento, y sigue ahí.
  await page.goto("/mi-catalogo/nuevo?tipo=producto");
  await expect(page.getByText("Antes de publicar en tu catálogo")).toBeVisible();
  await elegirComuna(page, "victoria", "Victoria");
  await page.getByLabel("Buscar actividad").fill("repuestos automotrices");
  await page.getByRole("button", { name: /^Todo Repuestos automotrices/ }).click();
  await page.getByLabel("Teléfono").fill("945678901");
  await page.getByRole("button", { name: "Guardar y continuar" }).click();

  await page.getByLabel("Nombre").fill("Disco ventilado Hilux");
  await page.getByRole("combobox").fill("disco de freno");
  await page.getByRole("option", { name: /^Pastillas y discos de freno/ }).click();
  await page.getByRole("button", { name: "Guardar y agregar fotos" }).click();
  await page.getByLabel("Fotos del producto o servicio").setInputFiles({
    name: "disco.png",
    mimeType: "image/png",
    buffer: await sharp({ create: { width: 800, height: 800, channels: 3, background: "#888" } })
      .png()
      .toBuffer(),
  });
  await expect(page.getByTestId("foto-item")).toHaveCount(1);
  await page.getByLabel("Precio (CLP, opcional)").fill("42990");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page).toHaveURL(/\/mi-catalogo$/);
  await expect(page.getByText(/\$42\.990/)).toBeVisible();

  await page.getByRole("button", { name: "Retirar" }).click();
  await expect(page.getByText("Retirado")).toBeVisible();
  await page.getByRole("button", { name: "Volver a publicar" }).click();
  await expect(page.getByRole("button", { name: "Retirar" })).toBeVisible();
  await salir(page);

  // Por producto del catálogo, ítem, rubro, rol y comuna.
  for (const ruta of [
    "/buscar?q=disco+ventilado+hilux",
    "/buscar?q=pastillas+de+freno+en+Victoria",
    "/buscar?q=repuestos+en+Victoria",
    "/buscar?q=repuestos+en+Victoria&rol=negocio",
  ]) {
    await page.goto(ruta);
    await expect(
      page.getByRole("link", { name: "Frenos Victoria", exact: true }),
      ruta,
    ).toBeVisible();
  }
  // El oficio no aplica a quien solo vende: no aparece como mecánico.
  await page.goto("/buscar?q=mec%C3%A1nico+en+Victoria");
  await expect(page.getByRole("link", { name: "Frenos Victoria", exact: true })).toHaveCount(0);

  await page.goto("/buscar?q=disco+ventilado+hilux");
  await page.getByRole("link", { name: "Frenos Victoria", exact: true }).click();
  await expect(
    page.locator("#catalogo").getByRole("img", { name: "Disco ventilado Hilux" }),
  ).toBeVisible();
});

test("ofrecer y buscar desde la misma cuenta", async ({ page }) => {
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill("panaderia-dona-rosa@conecta.demo");
  await page.getByLabel("Contraseña").fill(CLAVE_DEMO);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByRole("heading", { name: "Oportunidades para ti" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tus necesidades" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "¿Qué es Conecta?" })).toHaveCount(0);
});

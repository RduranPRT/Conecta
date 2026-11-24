import { expect, test, type Page } from "@playwright/test";

import { dv, elegirComuna, ingresar, registrar, rutNuevo, salir, visibleSinScroll } from "./ayudas";

async function campos(page: Page, alcance = page.locator("main form")) {
  return alcance.locator("input:visible, select:visible, textarea:visible").count();
}

test.describe("registro mínimo", () => {
  test("cuatro campos, con para qué, y botón final visible sin scroll", async ({ page }) => {
    await page.goto("/registro");
    expect(await campos(page)).toBe(4);
    for (const ayuda of [/Así te verán/, /Para entrar a tu cuenta/, /Para que solo tú entres/, /alguien real/]) {
      await expect(page.getByText(ayuda)).toBeVisible();
    }
    await expect(page.getByText("Paso 1 de 2")).toBeVisible();
    const { caja, alto } = await visibleSinScroll(page, page.getByRole("button", { name: "Crear mi cuenta" }));
    expect(caja.y + caja.height).toBeLessThanOrEqual(alto);
  });

  test("rechaza un RUT inválido o repetido y conserva lo escrito", async ({ page }) => {
    await page.goto("/registro");
    const llenar = async (rut: string) => {
      await page.getByLabel("Nombre").fill("Prueba Rut");
      await page.getByLabel("Correo").fill(`rut-${Date.now()}@prueba.test`);
      await page.getByLabel("Contraseña").fill("clave-de-prueba");
      await page.getByLabel(/^RUT/).fill(rut);
      await page.getByRole("button", { name: "Crear mi cuenta" }).click();
    };
    await llenar("12.345.678-9");
    await expect(page.getByText("Ese RUT no es válido")).toBeVisible();
    await expect(page.getByLabel("Nombre")).toHaveValue("Prueba Rut");
    await expect(page.getByLabel(/^RUT/)).toHaveValue("12.345.678-9");

    // El RUT de un perfil sembrado, escrito sin puntos.
    await llenar(`49000000-${dv(49_000_000)}`);
    await expect(page.getByText("Ya existe una cuenta con ese RUT")).toBeVisible();
  });
});

test("particular: se registra, busca un técnico de calefones y lo contacta", async ({ page }) => {
  await page.goto("/buscar?q=t%C3%A9cnico+de+calefones");
  await page.getByRole("link", { name: "Luis Muñoz · Técnico en calefones", exact: true }).click();
  await page.getByRole("link", { name: "Contactar", exact: true }).first().click();
  await page.getByRole("dialog").getByRole("link", { name: "Crear mi cuenta" }).click();

  await expect(page.getByText("Después vuelves a lo que estabas haciendo.")).toBeVisible();
  await registrar(page, { nombre: "Paula Particular", desdeAqui: true });

  await expect(page).toHaveURL(/\/p\/luis-munoz-tecnico|\/p\/luis-munoz/);
  await expect(page.getByText("Tu cuenta está lista.")).toBeVisible();
  await expect(page.getByTestId("datos-contacto")).toContainText("+56 9 6100 2006");
  await page.getByLabel(/^Mensaje para Luis/).fill("Hola, mi calefont no enciende.");
  await page.getByRole("button", { name: "Enviar mensaje" }).click();
  await expect(page).toHaveURL(/\/mensajes\/\d+/);
  await expect(page.getByText("Hola, mi calefont no enciende.")).toBeVisible();

  // Su perfil no muestra nada empresarial.
  await page.goto("/mi-perfil");
  await expect(page.getByLabel("Tu nombre")).toHaveValue("Paula Particular");
  for (const campo of ["Sitio web o red social (opcional)", "Dirección de atención (opcional)", "Correo de contacto (opcional)"]) {
    await expect(page.getByLabel(campo)).toHaveCount(0);
  }
  await expect(page.getByLabel(/¿Atiendes a domicilio/)).toHaveCount(0);
});

test("técnico independiente: al ofrecer se le pide solo comuna, actividad y teléfono", async ({ page }) => {
  await registrar(page, { nombre: "Teo Técnico" });
  await expect(page.getByRole("heading", { name: "Tu cuenta está lista" })).toBeVisible();
  await expect(page.getByText("Paso 2 de 2 · opcional")).toBeVisible();
  await page.getByRole("radio", { name: /^Ofrecer/ }).click();
  await page.getByRole("link", { name: "Continuar: qué ofrezco" }).click();

  const bloque = page.getByTestId("completar-datos");
  await expect(bloque.getByText("Faltan 3 datos")).toBeVisible();
  await expect(bloque.getByLabel(/^RUT/)).toHaveCount(0);

  await elegirComuna(page, "nunoa", "Ñuñoa");
  await page.getByLabel("Buscar actividad").fill("calefont");
  await page.getByRole("button", { name: /^Reparación de calefont/ }).click();

  // El +56 no es parte del campo: se escribe y se corrige solo el número.
  const telefono = page.getByLabel("Teléfono");
  await expect(telefono).toHaveAttribute("inputmode", "tel");
  await telefono.fill("9 1234 567");
  const boton = page.getByRole("button", { name: "Guardar y aparecer en Conecta" });
  await expect(boton).toBeInViewport();
  await boton.click();
  await expect(page.getByText("El teléfono debe tener 9 dígitos")).toBeVisible();
  await telefono.press("End");
  await telefono.pressSequentially("8");
  await expect(telefono).toHaveValue("9 1234 5678");
  await boton.click();

  await expect(page).toHaveURL(/\/mi-catalogo$/);
  await salir(page);
  await page.goto("/buscar?q=reparaci%C3%B3n+de+calefont&comuna=");
  await expect(page.getByRole("link", { name: "Teo Técnico", exact: true })).toBeVisible();
});

test("empresa de repuestos: se registra, completa, accede y edita sin bloqueos", async ({ page }) => {
  await registrar(page, { nombre: "Repuestos Paloma", empresa: true });
  await page.getByRole("link", { name: "Saltar por ahora" }).click();
  await expect(page).toHaveURL((u) => u.pathname === "/");

  await page.goto("/mi-perfil");
  await expect(page.getByLabel("Nombre de fantasía")).toHaveValue("Repuestos Paloma");
  await page.getByRole("checkbox", { name: /Vender productos/ }).check();
  await page.getByRole("checkbox", { name: /Abastecer a otros negocios/ }).check();
  // Quien solo vende productos no ve nada de prestador.
  await expect(page.getByLabel(/¿Atiendes a domicilio/)).toHaveCount(0);
  await expect(page.getByText("El oficio es opcional")).toHaveCount(0);

  await page.getByLabel("Buscar actividad").fill("pastillas");
  await page.getByRole("button", { name: /^Pastillas y discos de freno/ }).click();
  await page.getByLabel("Cuéntalo en una frase").fill("Repuestos para autos y camionetas.");
  await elegirComuna(page, "chillan", "Chillán");
  await page.getByLabel("Teléfono").fill("912340000");
  await expect(page.getByText("La dirección es pública:")).toBeVisible();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Listo: tu perfil quedó actualizado.")).toBeVisible();

  // Accede a su ficha y vuelve a editarla.
  await page.getByRole("link", { name: "Ver ficha pública" }).click();
  await expect(page.getByText("Empresa · Comercio · Proveedor a negocios")).toBeVisible();
  await expect(page.getByText("Chillán, Región de Ñuble").first()).toBeVisible();

  await page.goto("/mi-perfil");
  await expect(page.getByLabel("Teléfono")).toHaveValue("9 1234 0000");
  await page.getByLabel("Nombre de fantasía").fill("Repuestos Paloma Centro");
  await page.getByLabel("Teléfono").fill("12");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("El teléfono debe tener 9 dígitos")).toBeVisible();
  // Un error no borra lo escrito.
  await expect(page.getByLabel("Nombre de fantasía")).toHaveValue("Repuestos Paloma Centro");
  await page.getByLabel("Teléfono").fill("9 8888 7777");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Listo: tu perfil quedó actualizado.")).toBeVisible();

  await salir(page);
  await page.goto("/buscar?q=pastillas+de+freno+en+Chill%C3%A1n");
  await expect(page.getByRole("link", { name: "Repuestos Paloma Centro", exact: true })).toBeVisible();
});

test("cuenta antigua sin RUT: navega igual y se le pide al contactar", async ({ page }) => {
  // Clara es una cuenta sembrada sin RUT, como las anteriores a noviembre.
  await ingresar(page, "cuenta-antigua");
  await expect(page.getByText("Falta tu RUT.")).toBeVisible();
  await page.goto("/buscar?q=gasfiter");
  await expect(page.getByTestId("resultados")).toBeVisible();

  await page.goto("/p/gasfiteria-aguasur?accion=contactar");
  await expect(page.getByTestId("completar-datos")).toBeVisible();
  await page.getByLabel(/^RUT/).fill(rutNuevo());
  await page.getByRole("button", { name: "Guardar y continuar" }).click();
  await expect(page.getByLabel(/^Mensaje para Gasfitería/)).toBeVisible();
  await expect(page.getByText("Falta tu RUT.")).toHaveCount(0);
});

for (const [texto, comuna, territorio] of [
  ["putre", "Putre", "Putre, Arica y Parinacota"],
  ["nunoa", "Ñuñoa", "Ñuñoa, RM"],
  ["chillan", "Chillán", "Chillán, Ñuble"],
  ["puerto williams", "Cabo de Hornos", "Cabo de Hornos, Magallanes"],
] as const) {
  test(`un negocio de ${comuna} queda en su perfil, en la búsqueda y en el mapa`, async ({ page }) => {
    const nombre = `Almacén ${comuna} ${Date.now() % 10000}`;
    await registrar(page, { nombre, empresa: true });
    await page.goto("/completar?accion=ofrecer&next=/");
    await elegirComuna(page, texto, comuna);
    await page.getByLabel("Buscar actividad").fill("abarrotes");
    await page.getByRole("button", { name: /^Abarrotes y despensa/ }).click();
    await page.getByLabel("Teléfono").fill("9 5555 1234");
    await page.getByRole("button", { name: "Guardar y aparecer en Conecta" }).click();
    await expect(page).toHaveURL((u) => u.pathname === "/");

    await page.goto("/mi-perfil");
    await page.getByRole("link", { name: "Ver ficha pública" }).click();
    await expect(page.getByText(new RegExp(`^${comuna}, Región`)).first()).toBeVisible();
    await salir(page);

    await page.goto("/");
    await page.getByText("Cambiar").click();
    await elegirComuna(page, texto, comuna);
    await page.getByRole("button", { name: "Explorar aquí" }).click();
    await expect(page.getByText(`Explorando: ${territorio} · Cambiar`)).toBeVisible();
    await page.goto("/buscar?q=abarrotes");
    await expect(page.getByText(`Explorando: ${territorio} · Cambiar`)).toBeVisible();
    await expect(page.getByRole("link", { name: nombre, exact: true })).toBeVisible();
    await page.goto("/mapa?q=abarrotes");
    await expect(page.getByRole("link", { name: nombre, exact: true })).toBeVisible();
    await expect(page.locator(".marcador-conecta").first()).toBeAttached();
  });
}

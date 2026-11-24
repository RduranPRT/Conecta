import { expect, type Page } from "@playwright/test";

import { CLAVE_DEMO } from "./entorno";

/**
 * Lo que un visitante no puede recibir: teléfonos, correos, WhatsApp, sitios y
 * redes. Se busca en el cuerpo crudo de la respuesta (HTML y datos de React).
 */
export const PATRONES_CONTACTO: [string, RegExp][] = [
  ["teléfono con prefijo", /(?<![\d.])\+?56[\s-]?9[\s-]?\d{4}[\s-]?\d{4}(?!\d)/],
  ["celular", /(?<![\d.-])9[\s-]?\d{4}[\s-]?\d{4}(?![\d.-])/],
  ["correo", /[a-z0-9._%+-]+@[a-z0-9-]+\.(?:cl|com|demo|net|org)\b/i],
  ["WhatsApp", /wa\.me|api\.whatsapp|whatsapp:/i],
  ["red social", /instagram\.com|facebook\.com|tiktok\.com|linkedin\.com/i],
  [
    "campo privado",
    // Como clave de un objeto, también escapada dentro de los datos de React.
    /"(?:identificadorFiscal\w*|usuarioId|telefono|correoPublico|sitioWeb|redes)\\?":/,
  ],
];

export function buscarContacto(cuerpo: string) {
  return PATRONES_CONTACTO.flatMap(([nombre, patron]) => {
    const m = cuerpo.match(patron);
    return m ? [`${nombre}: ${m[0]}`] : [];
  });
}

export async function ingresar(page: Page, slug: string) {
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(`${slug}@conecta.demo`);
  await page.getByLabel("Contraseña").fill(CLAVE_DEMO);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL((u) => u.pathname === "/");
}

export async function salir(page: Page) {
  await page.context().clearCookies();
}

/** El elemento entra completo en la primera pantalla, sin hacer scroll. */
export async function visibleSinScroll(page: Page, selector: ReturnType<Page["locator"]>) {
  await expect(selector).toBeVisible();
  const caja = await selector.boundingBox();
  const alto = page.viewportSize()!.height;
  const desplazado = await page.evaluate(() => window.scrollY);
  expect(desplazado).toBe(0);
  expect(caja).not.toBeNull();
  expect(caja!.y).toBeGreaterThanOrEqual(0);
  return { caja: caja!, alto };
}

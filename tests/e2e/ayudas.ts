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

export function dv(cuerpo: number) {
  let suma = 0;
  let f = 2;
  for (const d of String(cuerpo).split("").reverse()) {
    suma += Number(d) * f;
    f = f === 7 ? 2 : f + 1;
  }
  const r = 11 - (suma % 11);
  return r === 11 ? "0" : r === 10 ? "K" : String(r);
}

/** RUT válido y distinto en cada llamada, lejos de los sembrados. */
let correlativo = 0;
export function rutNuevo(empresa = false) {
  correlativo += 1;
  const base = (empresa ? 97_000_000 : 48_000_000) + (Date.now() % 900_000) + correlativo;
  return `${base}-${dv(base)}`;
}

/** Alta mínima por pantalla: los cuatro campos y nada más. */
export async function registrar(
  page: Page,
  datos: { nombre: string; empresa?: boolean; desdeAqui?: boolean },
) {
  if (!datos.desdeAqui) await page.goto("/registro");
  correlativo += 1;
  const correo = `p${Date.now()}${correlativo}@prueba.test`;
  await page.getByLabel("Nombre").fill(datos.nombre);
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel("Contraseña").fill("clave-de-prueba");
  await page.getByLabel(/^RUT/).fill(rutNuevo(datos.empresa));
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await page.waitForURL((u) => u.pathname !== "/registro");
  return correo;
}

/** Escribe en el selector de comuna visible y elige de la lista. */
export async function elegirComuna(page: Page, texto: string, nombre: string) {
  await page.getByRole("combobox", { name: /comuna/i }).first().fill(texto);
  await page.getByRole("option", { name: new RegExp(`^${nombre} ·`) }).click();
}

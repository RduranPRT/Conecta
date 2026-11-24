import { expect, test } from "@playwright/test";

import { buscarContacto } from "./ayudas";

/**
 * Regla 4 del encargo: un dato oculto al visitante no se envía. Se revisa el
 * cuerpo crudo de cada pantalla pública, también en formato RSC (el que usa la
 * navegación interna).
 */
const PUBLICAS = [
  "/",
  "/buscar?q=electricista",
  "/buscar?q=pan",
  "/buscar?comuna=1",
  "/explorar",
  "/explorar/rubro-hogar",
  "/descubrir?zona=todo",
  "/mapa",
  "/p/gasfiteria-aguasur",
  "/p/pedro-soto-electricista",
  "/p/repuestos-del-sur",
  "/p/rodrigo-fuentes",
  "/publicaciones/1",
  "/necesidades/1",
  "/necesidades/3",
];

for (const ruta of PUBLICAS) {
  test(`el visitante no recibe contacto en ${ruta}`, async ({ request }) => {
    for (const headers of [{}, { RSC: "1" }] as Record<string, string>[]) {
      const respuesta = await request.get(ruta, { headers });
      expect(respuesta.status()).toBe(200);
      const cuerpo = await respuesta.text();
      expect(cuerpo.length).toBeGreaterThan(500);
      expect(buscarContacto(cuerpo)).toEqual([]);
    }
  });
}

test("las propuestas de una necesidad no llegan al visitante", async ({ request }) => {
  const cuerpo = await (await request.get("/necesidades/3")).text();
  expect(cuerpo).toContain("Ya recibió 2 propuestas.");
  expect(cuerpo).not.toContain("Salinas Gasfitería 24h");
  expect(cuerpo).not.toMatch(/38\.000|45\.000/);
});

test("el patrón de la prueba sí detecta un contacto", () => {
  expect(buscarContacto("llámame al +56 9 5555 1010")).not.toEqual([]);
  expect(buscarContacto("hola@conecta.demo")).not.toEqual([]);
});

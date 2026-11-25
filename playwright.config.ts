import { defineConfig, devices } from "@playwright/test";

import { ADMIN_E2E, BASE_E2E, PUERTO_E2E, ALMACEN_E2E, URL_E2E } from "./tests/e2e/entorno";

/**
 * Pruebas de punta a punta. Necesitan una base desechable en la propia máquina
 * (E2E_DATABASE_URL): `preparar.ts` la migra, la vacía y la siembra. Se corre
 * sobre el build de producción: `npm run build && npm run test:e2e`.
 *
 * En Windows se usa Microsoft Edge, ya instalado. En otro equipo:
 * `npx playwright install chromium` y E2E_CANAL vacío.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/preparar.ts",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  // Comparten base: en serie, para que un recorrido no altere a otro.
  workers: 1,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: URL_E2E,
    locale: "es-CL",
    trace: "retain-on-failure",
    channel: process.env.E2E_CANAL ?? (process.platform === "win32" ? "msedge" : undefined),
  },
  projects: [
    {
      name: "celular",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 390, height: 844 },
        channel: process.env.E2E_CANAL ?? (process.platform === "win32" ? "msedge" : undefined),
      },
    },
  ],
  webServer: {
    command: `npx next start -p ${PUERTO_E2E}`,
    url: `${URL_E2E}/api/salud`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      DATABASE_URL: BASE_E2E,
      BETTER_AUTH_SECRET: "solo-para-pruebas-e2e-0123456789abcdef",
      BETTER_AUTH_URL: URL_E2E,
      NEXT_PUBLIC_APP_URL: URL_E2E,
      ADMIN_EMAILS: ADMIN_E2E,
      STORAGE_DRIVER: "local",
      ALMACEN_LOCAL_DIR: ALMACEN_E2E,
      ANTHROPIC_API_KEY: "",
    },
  },
});

import path from "node:path";

export const PUERTO_E2E = Number(process.env.E2E_PUERTO ?? 3100);
export const URL_E2E = `http://localhost:${PUERTO_E2E}`;
export const BASE_E2E =
  process.env.E2E_DATABASE_URL ?? "postgres://conecta:conecta@127.0.0.1:5432/conecta_e2e";
export const ALMACEN_E2E = path.resolve("test-results", "almacen");
export const ADMIN_E2E = "rodrigo-fuentes@conecta.demo";
export const CLAVE_DEMO = "conecta2026";

/** Nunca se prepara una base que no esté en la propia máquina y no sea de e2e. */
export function exigirBaseLocal(url: string) {
  const { hostname, pathname } = new URL(url);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(hostname) || !pathname.includes("e2e")) {
    throw new Error(
      `E2E_DATABASE_URL debe ser local y llevar «e2e» en el nombre: ${hostname}${pathname}`,
    );
  }
}

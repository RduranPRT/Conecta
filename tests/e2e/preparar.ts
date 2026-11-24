import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

import { ALMACEN_E2E, BASE_E2E, exigirBaseLocal } from "./entorno";

/** Migra, vacía y siembra la base e2e con los mismos scripts del proyecto. */
export default function preparar() {
  if (process.env.E2E_SIN_PREPARAR) return;
  exigirBaseLocal(BASE_E2E);
  rmSync(ALMACEN_E2E, { recursive: true, force: true });
  const env = {
    ...process.env,
    DATABASE_URL: BASE_E2E,
    STORAGE_DRIVER: "local",
    ALMACEN_LOCAL_DIR: ALMACEN_E2E,
    NODE_ENV: "test" as const,
  };
  for (const paso of ["db:migrate", "db:reset", "db:seed"]) {
    execSync(`npm run ${paso}`, { env, stdio: "pipe" });
  }
}

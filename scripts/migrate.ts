/**
 * Aplica las migraciones y deja lista la base.
 * Se ejecuta en cada despliegue de Railway antes de arrancar la aplicación.
 */
import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL.");
  process.exit(1);
}

async function main() {
  const sql = postgres(url!, {
    max: 1,
    ssl: process.env.DATABASE_SSL === "true" ? "require" : undefined,
  });

  // pgvector se habilita el día 1 para que la Fase 2 no obligue a migrar.
  // Si la imagen de Postgres no trae la extensión, seguimos: nada la usa todavía.
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS vector`;
    console.log("· extensión pgvector disponible");
  } catch {
    console.warn("· pgvector no disponible en este servidor; se continúa sin ella");
  }

  await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  console.log("· migraciones aplicadas");
  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

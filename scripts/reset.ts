/** Vacía las tablas de datos (no las de esquema) para volver a sembrar. */
import "dotenv/config";

import { sql } from "drizzle-orm";

import { db } from "../src/db";

const TABLAS = [
  "calificaciones",
  "operaciones",
  "propuestas",
  "invitaciones",
  "publicaciones",
  "reacciones",
  "seguimientos",
  "mensajes",
  "conversacion_participantes",
  "conversaciones",
  "necesidades",
  "items",
  "verificaciones",
  "coberturas",
  "perfil_categorias",
  "perfil_roles",
  "acciones_agente",
  "agentes_contratados",
  "busquedas",
  "eventos",
  "perfiles",
  "session",
  "account",
  "verification",
  '"user"',
];

async function main() {
  if (process.env.NODE_ENV === "production" && !process.argv.includes("--si-de-verdad")) {
    console.error("Estás apuntando a producción. Repite con --si-de-verdad si es a propósito.");
    process.exit(1);
  }

  await db.execute(sql.raw(`truncate ${TABLAS.join(", ")} restart identity cascade`));
  console.log("· datos borrados (el esquema queda intacto)");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

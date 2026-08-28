import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * Conexión perezosa a PostgreSQL.
 *
 * `next build` importa todos los módulos para analizar las rutas, así que este
 * archivo se ejecuta durante la compilación. Si abriera la conexión al
 * importarse, el build exigiría DATABASE_URL —y fallaría en cualquier imagen
 * que no la tenga cargada. Se conecta en la primera consulta, no antes.
 */

const global_ = globalThis as unknown as {
  __conecta_sql?: ReturnType<typeof postgres>;
  __conecta_db?: ReturnType<typeof crear>;
};

function conectar() {
  const url = process.env.DATABASE_URL;

  // Durante `next build` no se ejecuta ninguna consulta: todas las páginas son
  // dinámicas. Si falta la variable en esa fase se usa un destino ficticio para
  // que la compilación no dependa de secretos de ejecución; postgres-js no abre
  // la conexión hasta la primera consulta real.
  const compilando = process.env.NEXT_PHASE === "phase-production-build";

  if (!url && !compilando) {
    throw new Error(
      "Falta DATABASE_URL. En local: postgres://conecta:conecta@localhost:5432/conecta. " +
        "En Railway: usa la referencia ${{Postgres.DATABASE_URL}} para viajar por la red privada.",
    );
  }

  // En desarrollo Next recarga los módulos en cada cambio; sin este singleton
  // cada recarga abriría un pool nuevo hasta agotar las conexiones de Postgres.
  global_.__conecta_sql ??= postgres(url ?? "postgres://compilacion@127.0.0.1:5432/compilacion", {
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    ssl: process.env.DATABASE_SSL === "true" ? "require" : undefined,
    prepare: false,
  });

  return global_.__conecta_sql;
}

function crear() {
  return drizzle(conectar(), { schema, casing: "snake_case" });
}

export type Db = ReturnType<typeof crear>;

/**
 * Se comporta como la instancia de Drizzle, pero solo la construye cuando
 * alguien la usa de verdad.
 */
export const db: Db = new Proxy({} as Db, {
  get(_destino, propiedad, receptor) {
    global_.__conecta_db ??= crear();
    const valor = Reflect.get(global_.__conecta_db as object, propiedad, receptor);
    return typeof valor === "function" ? valor.bind(global_.__conecta_db) : valor;
  },
  has(_destino, propiedad) {
    global_.__conecta_db ??= crear();
    return propiedad in (global_.__conecta_db as object);
  },
});

/** Cliente crudo de postgres-js, por si hace falta SQL fuera de Drizzle. */
export function sqlCrudo() {
  return conectar();
}

import { sql } from "drizzle-orm";

import { db } from "@/db";

/** Railway usa esta ruta como healthcheck del despliegue. */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ estado: "ok", base: "conectada", momento: new Date().toISOString() });
  } catch {
    return Response.json({ estado: "degradado", base: "sin conexión" }, { status: 503 });
  }
}

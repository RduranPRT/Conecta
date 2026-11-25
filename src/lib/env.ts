import { z } from "zod";

/**
 * Variables de almacenamiento. Se leen al usarlas, no al importar: `next build`
 * carga todos los módulos y no debe exigir secretos de ejecución.
 */
const vacioEsAusente = (v: unknown) => (typeof v === "string" && !v.trim() ? undefined : v);
const texto = z.preprocess(vacioEsAusente, z.string().optional());

const esquema = z.object({
  STORAGE_DRIVER: z.preprocess(vacioEsAusente, z.enum(["r2", "local"]).optional()),
  ALMACEN_LOCAL_DIR: texto,
  R2_ACCOUNT_ID: texto,
  R2_ACCESS_KEY_ID: texto,
  R2_SECRET_ACCESS_KEY: texto,
  R2_BUCKET: texto,
  R2_PUBLIC_URL: z.preprocess(vacioEsAusente, z.url().optional()),
});

export type ConfigAlmacenamiento =
  | { driver: "local"; directorio: string }
  | {
      driver: "r2";
      cuenta: string;
      claveAcceso: string;
      claveSecreta: string;
      bucket: string;
      urlPublica: string;
    }
  | { driver: "deshabilitado"; motivo: string };

type Entorno = Record<string, string | undefined>;

export function configAlmacenamiento(entorno: Entorno = process.env): ConfigAlmacenamiento {
  const leido = esquema.safeParse(entorno);
  if (!leido.success) {
    return {
      driver: "deshabilitado",
      motivo: `Variables de almacenamiento no válidas: ${leido.error.issues
        .map((i) => i.path.join("."))
        .join(", ")}`,
    };
  }
  const v = leido.data;
  const driver = v.STORAGE_DRIVER ?? (entorno.NODE_ENV === "production" ? undefined : "local");

  // El disco de Railway se borra en cada despliegue: en producción hay que
  // elegirlo a propósito.
  if (!driver) return { driver: "deshabilitado", motivo: "Falta STORAGE_DRIVER en producción." };
  if (driver === "local") {
    return { driver, directorio: v.ALMACEN_LOCAL_DIR ?? ".almacen" };
  }

  const faltan = (
    ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_URL"] as const
  ).filter((k) => !v[k]);
  if (faltan.length) {
    return { driver: "deshabilitado", motivo: `Faltan variables de R2: ${faltan.join(", ")}` };
  }
  return {
    driver,
    cuenta: v.R2_ACCOUNT_ID!,
    claveAcceso: v.R2_ACCESS_KEY_ID!,
    claveSecreta: v.R2_SECRET_ACCESS_KEY!,
    bucket: v.R2_BUCKET!,
    urlPublica: v.R2_PUBLIC_URL!.replace(/\/+$/, ""),
  };
}

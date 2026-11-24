import { configAlmacenamiento } from "@/lib/env";

import { AlmacenamientoLocal } from "./local";
import { AlmacenamientoR2 } from "./r2";
import type { Almacenamiento } from "./tipos";

export type { Almacenamiento } from "./tipos";

let actual: Almacenamiento | null = null;

/** Se elige por variable de entorno la primera vez que se usa. */
export function almacenamiento(): Almacenamiento {
  if (actual) return actual;
  const config = configAlmacenamiento();
  if (config.driver === "deshabilitado") {
    console.error(`[Conecta] Carga de fotos deshabilitada: ${config.motivo}`);
    throw new Error("La carga de fotos todavía no está habilitada. Intenta más adelante.");
  }
  actual =
    config.driver === "r2" ? new AlmacenamientoR2(config) : new AlmacenamientoLocal(config.directorio);
  return actual;
}

/** El disco local, si es el que está en uso: solo para servir sus archivos. */
export function almacenamientoLocal() {
  const config = configAlmacenamiento();
  return config.driver === "local" ? new AlmacenamientoLocal(config.directorio) : null;
}

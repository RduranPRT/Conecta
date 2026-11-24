import sharp from "sharp";

/** Reglas de las fotos (D4). Sin base ni almacenamiento: se prueban solas. */

export const MAXIMO_BYTES = 5 * 1024 * 1024;
export const MAXIMO_POR_ITEM = 5;
export const LADO_DETALLE = 1600;
export const LADO_MINIATURA = 400;
/** Un archivo chico puede abrirse en miles de millones de píxeles. */
const MAXIMO_PIXELES = 60_000_000;

export type TipoImagen = "jpeg" | "png" | "webp";

/** Tipo real por los primeros bytes: la extensión la escribe cualquiera. */
export function tipoReal(datos: Uint8Array): TipoImagen | null {
  const empieza = (firma: number[], desde = 0) => firma.every((b, i) => datos[desde + i] === b);
  if (empieza([0xff, 0xd8, 0xff])) return "jpeg";
  if (empieza([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (empieza([0x52, 0x49, 0x46, 0x46]) && empieza([0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  return null;
}

export type ImagenProcesada = {
  detalle: Buffer;
  miniatura: Buffer;
  ancho: number;
  alto: number;
};

/**
 * Valida y convierte: WebP en dos tamaños, rotada según la cámara y sin
 * metadatos. `sharp` no copia EXIF salvo que se lo pidan: no se le pide, así
 * que el GPS de la foto no sale de aquí.
 */
export async function procesarImagen(datos: Buffer): Promise<ImagenProcesada> {
  if (!datos.length) throw new Error("El archivo está vacío.");
  if (datos.length > MAXIMO_BYTES) {
    throw new Error("La foto pesa más de 5 MB. Elige una más liviana.");
  }
  if (!tipoReal(datos)) {
    throw new Error("Ese archivo no es una foto. Usa JPG, PNG o WebP.");
  }

  try {
    const base = sharp(datos, { limitInputPixels: MAXIMO_PIXELES, failOn: "error" }).rotate();
    const detalle = await base
      .clone()
      .resize({ width: LADO_DETALLE, height: LADO_DETALLE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    const miniatura = await base
      .clone()
      .resize({ width: LADO_MINIATURA, height: LADO_MINIATURA, fit: "cover" })
      .webp({ quality: 78 })
      .toBuffer();
    return {
      detalle: detalle.data,
      miniatura,
      ancho: detalle.info.width,
      alto: detalle.info.height,
    };
  } catch {
    throw new Error("No pudimos abrir esa foto. Puede estar dañada: prueba con otra.");
  }
}

/** Lo único que el resto de la aplicación sabe del almacenamiento. */
export interface Almacenamiento {
  subir(clave: string, contenido: Buffer, tipo: string): Promise<void>;
  /** Borrar algo que ya no está no es un error. */
  eliminar(claves: string[]): Promise<void>;
  urlPublica(clave: string): string;
}

/** Claves propias: minúsculas, números, guiones y barras. Nada de «..». */
export function claveValida(clave: string) {
  return /^[a-z0-9][a-z0-9/-]{0,180}\.webp$/.test(clave) && !clave.includes("//");
}

export function exigirClave(clave: string) {
  if (!claveValida(clave)) throw new Error(`Clave de archivo no válida: ${clave}`);
  return clave;
}

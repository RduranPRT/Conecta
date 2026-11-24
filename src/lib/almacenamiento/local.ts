import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { claveValida, exigirClave, type Almacenamiento } from "./tipos";

/** Disco de la propia máquina: desarrollo y pruebas. */
export class AlmacenamientoLocal implements Almacenamiento {
  constructor(private readonly directorio: string) {}

  private ruta(clave: string) {
    return path.join(path.resolve(this.directorio), ...exigirClave(clave).split("/"));
  }

  async subir(clave: string, contenido: Buffer) {
    const ruta = this.ruta(clave);
    await mkdir(path.dirname(ruta), { recursive: true });
    await writeFile(ruta, contenido);
  }

  async eliminar(claves: string[]) {
    await Promise.all(claves.map((c) => rm(this.ruta(c), { force: true })));
  }

  urlPublica(clave: string) {
    return `/api/archivos/${exigirClave(clave)}`;
  }

  /** Solo lo usa la ruta que sirve los archivos. */
  async leer(clave: string): Promise<Buffer | null> {
    if (!claveValida(clave)) return null;
    try {
      return await readFile(this.ruta(clave));
    } catch {
      return null;
    }
  }
}

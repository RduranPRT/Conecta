import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import type { ConfigAlmacenamiento } from "@/lib/env";

import { exigirClave, type Almacenamiento } from "./tipos";

type ConfigR2 = Extract<ConfigAlmacenamiento, { driver: "r2" }>;

/** Cloudflare R2, con la API compatible con S3 (D3). */
export class AlmacenamientoR2 implements Almacenamiento {
  private readonly cliente: Pick<S3Client, "send">;

  constructor(
    private readonly config: ConfigR2,
    cliente?: Pick<S3Client, "send">,
  ) {
    this.cliente =
      cliente ??
      new S3Client({
        region: "auto",
        endpoint: `https://${config.cuenta}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: config.claveAcceso, secretAccessKey: config.claveSecreta },
        // R2 no acepta los checksums que el SDK agrega por omisión.
        requestChecksumCalculation: "WHEN_REQUIRED",
        responseChecksumValidation: "WHEN_REQUIRED",
      });
  }

  async subir(clave: string, contenido: Buffer, tipo: string) {
    await this.cliente.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: exigirClave(clave),
        Body: contenido,
        ContentType: tipo,
        // La clave cambia con cada foto: el contenido de una clave no cambia.
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  }

  async eliminar(claves: string[]) {
    if (!claves.length) return;
    const r = await this.cliente.send(
      new DeleteObjectsCommand({
        Bucket: this.config.bucket,
        Delete: { Objects: claves.map((c) => ({ Key: exigirClave(c) })), Quiet: true },
      }),
    );
    const errores = (r as { Errors?: { Key?: string }[] }).Errors ?? [];
    if (errores.length) {
      throw new Error(`R2 no pudo borrar: ${errores.map((e) => e.Key).join(", ")}`);
    }
  }

  urlPublica(clave: string) {
    return `${this.config.urlPublica}/${exigirClave(clave)}`;
  }
}

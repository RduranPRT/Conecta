import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";

import { AlmacenamientoLocal } from "@/lib/almacenamiento/local";
import { AlmacenamientoR2 } from "@/lib/almacenamiento/r2";
import { claveValida } from "@/lib/almacenamiento/tipos";
import { configAlmacenamiento } from "@/lib/env";
import { procesarImagen, tipoReal } from "@/lib/imagenes";

function foto(ancho = 2400, alto = 1200, color = "#c33") {
  return sharp({ create: { width: ancho, height: alto, channels: 3, background: color } });
}

/** JPG con cámara, orientación y GPS, como el de un celular. */
const conGps = () =>
  foto()
    .withMetadata({ orientation: 6 })
    .withExifMerge({
      IFD0: { Make: "Celular de prueba" },
      IFD3: {
        GPSLatitudeRef: "S",
        GPSLatitude: "33/1 27/1 0/1",
        GPSLongitudeRef: "W",
        GPSLongitude: "70/1 35/1 0/1",
      },
    })
    .jpeg()
    .toBuffer();

describe("procesamiento de fotos", () => {
  it("quita EXIF y GPS de los dos tamaños", async () => {
    const original = await conGps();
    const antes = await sharp(original).metadata();
    expect(antes.exif).toBeDefined();
    expect(original.includes("Celular de prueba")).toBe(true);

    const { detalle, miniatura } = await procesarImagen(original);
    for (const salida of [detalle, miniatura]) {
      const m = await sharp(salida).metadata();
      expect(m.format).toBe("webp");
      expect(m.exif).toBeUndefined();
      expect(m.xmp).toBeUndefined();
      expect(m.iptc).toBeUndefined();
      expect(m.orientation).toBeUndefined();
      expect(salida.includes("Celular de prueba")).toBe(false);
      expect(salida.includes("EXIF")).toBe(false);
    }
  });

  it("rota según la cámara y limita a 1600 y 400 px", async () => {
    const { detalle, miniatura, ancho, alto } = await procesarImagen(await conGps());
    // 2400×1200 con orientación 6 queda vertical.
    expect([ancho, alto]).toEqual([800, 1600]);
    const d = await sharp(detalle).metadata();
    expect([d.width, d.height]).toEqual([800, 1600]);
    const m = await sharp(miniatura).metadata();
    expect([m.width, m.height]).toEqual([400, 400]);
  });

  it("no agranda fotos chicas", async () => {
    const r = await procesarImagen(await foto(300, 200).png().toBuffer());
    expect([r.ancho, r.alto]).toEqual([300, 200]);
  });

  it("acepta JPG, PNG y WebP", async () => {
    for (const b of [foto().jpeg(), foto().png(), foto().webp()]) {
      await expect(procesarImagen(await b.toBuffer())).resolves.toBeTruthy();
    }
  });

  it("rechaza 6 MB, un .exe renombrado, un SVG y una foto dañada, con mensaje claro", async () => {
    await expect(procesarImagen(Buffer.alloc(6 * 1024 * 1024, 0xff))).rejects.toThrow(/5 MB/);
    const exe = Buffer.concat([Buffer.from("MZ"), Buffer.alloc(2000, 1)]);
    await expect(procesarImagen(exe)).rejects.toThrow(/no es una foto/);
    await expect(procesarImagen(Buffer.from("<svg onload='x'/>"))).rejects.toThrow(/no es una foto/);
    const danada = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(500, 7)]);
    await expect(procesarImagen(danada)).rejects.toThrow(/dañada/);
    await expect(procesarImagen(Buffer.alloc(0))).rejects.toThrow(/vacío/);
  });

  it("reconoce el tipo por los bytes", async () => {
    expect(tipoReal(await foto().webp().toBuffer())).toBe("webp");
    expect(tipoReal(Buffer.from("GIF89a"))).toBeNull();
  });
});

describe("almacenamiento local", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "conecta-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("sube, sirve y elimina de verdad", async () => {
    const a = new AlmacenamientoLocal(dir);
    const clave = "perfiles/1/abc-mini.webp";
    await a.subir(clave, Buffer.from("hola"));
    expect(existsSync(path.join(dir, "perfiles", "1", "abc-mini.webp"))).toBe(true);
    expect((await a.leer(clave))?.toString()).toBe("hola");
    expect(a.urlPublica(clave)).toBe(`/api/archivos/${clave}`);
    await a.eliminar([clave, "perfiles/1/no-existe.webp"]);
    expect(existsSync(path.join(dir, "perfiles", "1", "abc-mini.webp"))).toBe(false);
    expect(await a.leer(clave)).toBeNull();
  });

  it("no sale de su carpeta", async () => {
    const a = new AlmacenamientoLocal(dir);
    for (const clave of ["../fuera.webp", "a/../../b.webp", "/etc/x.webp", "a//b.webp", "a.txt", "C:/x.webp"]) {
      expect([clave, claveValida(clave)]).toEqual([clave, false]);
      expect(await a.leer(clave)).toBeNull();
      await expect(a.subir(clave, Buffer.from("x"))).rejects.toThrow(/no válida/);
    }
  });
});

describe("almacenamiento R2", () => {
  const config = {
    driver: "r2" as const,
    cuenta: "c",
    claveAcceso: "a",
    claveSecreta: "s",
    bucket: "fotos",
    urlPublica: "https://fotos.ejemplo.cl",
  };

  it("sube con tipo y caché, borra por lote y arma la URL pública", async () => {
    const enviados: { input: Record<string, unknown> }[] = [];
    const r2 = new AlmacenamientoR2(config, {
      send: async (c: unknown) => {
        enviados.push(c as { input: Record<string, unknown> });
        return {};
      },
    } as never);
    await r2.subir("items/1/x.webp", Buffer.from("x"), "image/webp");
    await r2.eliminar(["items/1/x.webp", "items/1/x-mini.webp"]);
    await r2.eliminar([]);
    expect(enviados).toHaveLength(2);
    expect(enviados[0].input).toMatchObject({
      Bucket: "fotos",
      Key: "items/1/x.webp",
      ContentType: "image/webp",
    });
    expect(enviados[1].input).toMatchObject({
      Delete: { Objects: [{ Key: "items/1/x.webp" }, { Key: "items/1/x-mini.webp" }] },
    });
    expect(r2.urlPublica("items/1/x.webp")).toBe("https://fotos.ejemplo.cl/items/1/x.webp");
  });

  it("avisa si R2 no pudo borrar", async () => {
    const r2 = new AlmacenamientoR2(config, {
      send: async () => ({ Errors: [{ Key: "items/1/x.webp" }] }),
    } as never);
    await expect(r2.eliminar(["items/1/x.webp"])).rejects.toThrow(/items\/1\/x/);
  });
});

describe("configuración", () => {
  it("en desarrollo usa el disco; en producción exige elegir", () => {
    expect(configAlmacenamiento({ NODE_ENV: "development" }).driver).toBe("local");
    expect(configAlmacenamiento({ NODE_ENV: "production" }).driver).toBe("deshabilitado");
    expect(configAlmacenamiento({ NODE_ENV: "production", STORAGE_DRIVER: "local" }).driver).toBe("local");
  });

  it("con R2 incompleto dice qué falta", () => {
    const c = configAlmacenamiento({ STORAGE_DRIVER: "r2", R2_BUCKET: "x" });
    expect(c.driver).toBe("deshabilitado");
    expect(c.driver === "deshabilitado" && c.motivo).toMatch(/R2_ACCOUNT_ID.*R2_PUBLIC_URL/);
  });

  it("con R2 completo queda listo", () => {
    const c = configAlmacenamiento({
      NODE_ENV: "production",
      STORAGE_DRIVER: "r2",
      R2_ACCOUNT_ID: "c",
      R2_ACCESS_KEY_ID: "a",
      R2_SECRET_ACCESS_KEY: "s",
      R2_BUCKET: "b",
      R2_PUBLIC_URL: "https://fotos.ejemplo.cl/",
    });
    expect(c).toMatchObject({ driver: "r2", urlPublica: "https://fotos.ejemplo.cl" });
  });
});

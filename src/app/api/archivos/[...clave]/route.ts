import { almacenamientoLocal } from "@/lib/almacenamiento";

export const dynamic = "force-dynamic";

/**
 * Sirve las fotos del disco local (desarrollo y pruebas). Con R2 no se usa: las
 * fotos salen de su URL pública.
 */
export async function GET(_: Request, { params }: { params: Promise<{ clave: string[] }> }) {
  const contenido = await almacenamientoLocal()?.leer((await params).clave.join("/"));
  if (!contenido) return new Response("No existe", { status: 404 });
  return new Response(new Uint8Array(contenido), {
    headers: {
      "content-type": "image/webp",
      "x-content-type-options": "nosniff",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

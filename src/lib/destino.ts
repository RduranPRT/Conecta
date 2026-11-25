/**
 * Retorno a la acción (N03). Después de ingresar o registrarse, la persona
 * vuelve a donde estaba. `next` viene en la URL, así que se trata como dato
 * ajeno: solo se aceptan rutas internas relativas. Cualquier otra cosa lleva a
 * Inicio, para no convertir el login en una redirección abierta.
 */

export const INICIO = "/";

const BASE = "http://interno.invalid";

/** Pantallas a las que no tiene sentido volver después de ingresar. */
const SIN_RETORNO = ["/ingresar", "/registro", "/onboarding", "/api"];

function tieneCaracterInseguro(valor: string) {
  for (const c of valor) {
    const codigo = c.codePointAt(0)!;
    if (codigo < 32 || codigo === 127 || c === "\\") return true;
  }
  return false;
}

export function destinoSeguro(next: string | null | undefined, porDefecto = INICIO): string {
  if (!next || next.length > 500) return porDefecto;
  // «//host» y «/\host» son absolutos para el navegador.
  if (!next.startsWith("/") || next.startsWith("//")) return porDefecto;
  if (tieneCaracterInseguro(next)) return porDefecto;

  let url: URL;
  try {
    url = new URL(next, BASE);
  } catch {
    return porDefecto;
  }
  if (url.origin !== BASE) return porDefecto;
  // «/..//host» se resuelve a «//host»: se vuelve a revisar ya normalizada.
  if (url.pathname.startsWith("//")) return porDefecto;
  if (SIN_RETORNO.some((r) => url.pathname === r || url.pathname.startsWith(`${r}/`))) {
    return porDefecto;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Agrega parámetros a una ruta interna sin perder los que ya trae. */
export function conParametros(ruta: string, parametros: Record<string, string>) {
  const url = new URL(ruta, BASE);
  for (const [clave, valor] of Object.entries(parametros)) url.searchParams.set(clave, valor);
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Enlace a ingresar o registrarse que vuelve a `next`. */
export function rutaIngreso(next: string, pantalla: "/ingresar" | "/registro" = "/ingresar") {
  const destino = destinoSeguro(next);
  return destino === INICIO ? pantalla : `${pantalla}?next=${encodeURIComponent(destino)}`;
}

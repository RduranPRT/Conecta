/**
 * Textos libres para visitantes (D5). Las columnas de contacto nunca llegan al
 * visitante, pero la gente también escribe su teléfono o su Instagram en la
 * descripción. Se reemplazan en el servidor, antes de armar la respuesta.
 */

export const AVISO_CONTACTO = "[inicia sesión para ver el contacto]";

const PATRONES: RegExp[] = [
  // Correos.
  /[a-z0-9._%+-]+\s?@\s?[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi,
  // Enlaces, con o sin protocolo.
  /(?:https?:\/\/|www\.)\S+/gi,
  /\b(?:wa\.me|t\.me|bit\.ly)\/?\S*/gi,
  /\b[a-z0-9-]{2,}(?:\.[a-z0-9-]+)*\.(?:cl|com|net|org|io|shop|store)\b(?:\/\S*)?/gi,
  // Cuentas de redes: «@panaderia».
  /(?<![\w.])@[a-z0-9_.]{3,}/gi,
  // Celulares chilenos, con o sin +56 y con separadores.
  /(?<!\d)(?:\(?\+?56\)?[\s.-]*)?9[\s.-]*\d{4}[\s.-]*\d{4}(?!\d)/g,
  // Fijos chilenos: código de área y número separados.
  /(?<!\d)(?:\(?\+?56\)?[\s.-]*)?\(?[2-8]\d?\)?[\s-]+\d{3,4}[\s-]+\d{4}(?!\d)/g,
  // Otros internacionales.
  /\+\d{1,3}(?:[\s.-]*\d){7,12}(?!\d)/g,
];

/** Dos o más avisos seguidos se leen como uno. */
function juntarAvisos(texto: string) {
  const partes = texto.split(AVISO_CONTACTO);
  let salida = partes[0];
  for (let i = 1; i < partes.length; i += 1) {
    const hayMas = i < partes.length - 1;
    const soloSeparador = partes[i].trim() === "" || /^[\s/,·-]+$/.test(partes[i]);
    if (hayMas && soloSeparador) continue;
    salida += AVISO_CONTACTO + partes[i];
  }
  return salida;
}

export function ocultarContacto<T extends string | null | undefined>(texto: T): T {
  if (!texto) return texto;
  let salida: string = texto;
  for (const patron of PATRONES) salida = salida.replace(patron, AVISO_CONTACTO);
  return juntarAvisos(salida) as T;
}

/** Aplica `ocultarContacto` solo cuando quien mira no tiene sesión. */
export function textoPara<T extends string | null | undefined>(texto: T, conSesion: boolean): T {
  return conSesion ? texto : ocultarContacto(texto);
}

/**
 * RUT chileno (D6). Se valida con módulo 11; no se consulta al SII. El campo
 * del perfil se llama `identificadorFiscal` porque el modelo no asume país.
 */

/** Desde este número los RUT son de personas jurídicas. */
const DESDE_EMPRESA = 50_000_000;

export function digitoVerificador(cuerpo: number) {
  let suma = 0;
  let factor = 2;
  for (const d of String(cuerpo).split("").reverse()) {
    suma += Number(d) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  return resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
}

/** «12.345.678-5», «12345678-5» o «123456785» → «12345678-5». null si no es válido. */
export function normalizarRut(texto: string | null | undefined): string | null {
  const limpio = (texto ?? "").trim().toUpperCase().replace(/[.\s]/g, "").replace(/[–—]/g, "-");
  const m = limpio.match(/^0*(\d{6,8})-?([\dK])$/);
  if (!m) return null;
  const cuerpo = Number(m[1]);
  if (cuerpo < 100_000) return null;
  return digitoVerificador(cuerpo) === m[2] ? `${cuerpo}-${m[2]}` : null;
}

/** «12345678-5» → «12.345.678-5». */
export function formatearRut(normalizado: string) {
  const [cuerpo, dv] = normalizado.split("-");
  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
}

export function esRutDeEmpresa(normalizado: string) {
  return Number(normalizado.split("-")[0]) >= DESDE_EMPRESA;
}

/** Valida y explica qué está mal, con palabras. */
export function exigirRut(texto: string | null | undefined): string {
  if (!texto?.trim()) throw new Error("Escribe tu RUT. Ejemplo: 12.345.678-5.");
  const normalizado = normalizarRut(texto);
  if (!normalizado) {
    throw new Error(
      "Ese RUT no es válido. Revisa los números y el dígito final. Ejemplo: 12.345.678-5.",
    );
  }
  return normalizado;
}

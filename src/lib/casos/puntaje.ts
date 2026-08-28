/**
 * Orden de resultados. Función pura y sin dependencias: se puede probar sola
 * y la usan por igual el buscador, el mapa, el matching y el asistente.
 */

/**
 * Prioridad de resultados: distancia, relevancia, disponibilidad y reputación,
 * en ese orden de peso. El usuario puede reordenar, pero este es el orden que
 * la plataforma propone sin que nadie lo pida.
 */
export function puntuar(entrada: {
  distancia: number | null;
  /** La consulta identificó una categoría concreta. */
  pideCategoria?: boolean;
  categoriaCoincide: boolean;
  terminoCoincide: boolean;
  disponibleAhora: boolean;
  pideHoy: boolean;
  reputacion: number | null;
  conteo: number;
  verificado: boolean;
}) {
  const razones: string[] = [];

  // Distancia · 35 %. Sin ubicación conocida, un valor neutro.
  let proximidad = 0.5;
  if (entrada.distancia !== null) {
    proximidad = Math.max(0, 1 - entrada.distancia / 25);
    if (entrada.distancia <= 3) razones.push("muy cerca");
  }

  // Relevancia · 25 %.
  // Cuando la consulta sí identificó una categoría, quedar fuera de ella pesa:
  // si no, un actor cercano que solo coincide por una palabra suelta le gana
  // al que efectivamente hace ese trabajo.
  let relevancia = 0.3;
  if (entrada.categoriaCoincide) {
    relevancia = 1;
    razones.push("categoría exacta");
  } else if (entrada.terminoCoincide) {
    relevancia = entrada.pideCategoria ? 0.35 : 0.7;
    razones.push("coincide con lo buscado");
  } else if (entrada.pideCategoria) {
    relevancia = 0.15;
  }

  // Disponibilidad · 20 %.
  let disponibilidad = entrada.disponibleAhora ? 1 : 0.35;
  if (entrada.disponibleAhora) razones.push("disponible ahora");
  if (entrada.pideHoy && !entrada.disponibleAhora) disponibilidad = 0.15;

  // Reputación · 20 %. Sin reseñas no se castiga: se asume neutro.
  const reputacion = entrada.reputacion ? entrada.reputacion / 5 : 0.55;
  if (entrada.reputacion && entrada.reputacion >= 4.5 && entrada.conteo >= 3) {
    razones.push("bien evaluado");
  }

  let puntaje =
    0.35 * proximidad + 0.25 * relevancia + 0.2 * disponibilidad + 0.2 * reputacion;

  // La verificación no se compra: suma poco, pero suma.
  if (entrada.verificado) {
    puntaje += 0.03;
    razones.push("verificado");
  }

  return { puntaje: Number(puntaje.toFixed(4)), motivo: razones.slice(0, 3).join(" · ") };
}

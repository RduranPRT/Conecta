/** Formatos localizados. La moneda viaja con el dato: nada asume CLP. */

export function monto(valor: number | string | null | undefined, moneda = "CLP") {
  if (valor === null || valor === undefined || valor === "") return "—";
  const n = typeof valor === "string" ? Number(valor) : valor;
  if (Number.isNaN(n)) return "—";
  const sinDecimales = moneda === "CLP" || moneda === "PYG";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: sinDecimales ? 0 : 2,
  }).format(n);
}

export function fecha(valor: Date | string | null | undefined) {
  if (!valor) return "—";
  const d = typeof valor === "string" ? new Date(valor) : valor;
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(d);
}

export function fechaHora(valor: Date | string | null | undefined) {
  if (!valor) return "—";
  const d = typeof valor === "string" ? new Date(valor) : valor;
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function haceCuanto(valor: Date | string | null | undefined) {
  if (!valor) return "";
  const d = typeof valor === "string" ? new Date(valor) : valor;
  const segundos = Math.floor((Date.now() - d.getTime()) / 1000);
  if (segundos < 60) return "recién";
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `hace ${dias} d`;
  return fecha(d);
}

export function reputacion(promedio: string | number | null | undefined, conteo: number) {
  if (!promedio || conteo === 0) return "Sin calificaciones";
  const n = typeof promedio === "string" ? Number(promedio) : promedio;
  return `${n.toFixed(1).replace(".", ",")} · ${conteo} ${conteo === 1 ? "reseña" : "reseñas"}`;
}

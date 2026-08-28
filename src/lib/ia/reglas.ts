import type { RolActor } from "@/db/schema";
import { normalizar } from "@/lib/utils";

import { intencionVacia, type ContextoInterprete, type Intencion } from "./tipos";

const CONECTORES = new Set([
  "a","al","algo","alguien","algun","alguna","ante","aqui","busco","buscar","cerca","como","con",
  "contratar","cual","de","del","donde","el","ella","en","encontrar","es","esta","este","hay","la",
  "las","le","lo","los","me","mi","necesito","necesitamos","o","para","pero","por","que","quien",
  "quiero","se","ser","si","sobre","su","tengo","un","una","uno","unos","urgente","y","ya",
]);

const MARCAS_CERCANIA = [
  "cerca de mi","cerca mio","cerca","cercano","cercana","por aqui","en mi barrio","alrededor",
  "a la vuelta","mas cercano","mas cerca",
];

const MARCAS_HOY = ["hoy","ahora","urgente","de inmediato","cuanto antes","ya","emergencia","hoy mismo"];
const MARCAS_SEMANA = ["esta semana","en la semana","proximos dias","antes del viernes","manana"];

const MARCAS_ROL: Record<string, RolActor> = {
  proveedor: "proveedor",
  proveedores: "proveedor",
  distribuidor: "proveedor",
  mayorista: "proveedor",
  productor: "productor",
  productores: "productor",
  agricultor: "productor",
  productora: "productor",
  negocio: "negocio",
  negocios: "negocio",
  tienda: "negocio",
  local: "negocio",
  empresa: "negocio",
  prestador: "prestador",
  tecnico: "prestador",
  maestro: "prestador",
  profesional: "prestador",
  persona: "persona",
};

const MARCAS_PRODUCTO = ["comprar","kilos","cajas","unidades","stock","docena","litros","sacos","toneladas"];
const MARCAS_SERVICIO = ["reparar","arreglar","instalar","servicio","mantencion","asesoria","limpieza","pintar"];

/**
 * Intérprete determinista. Es la implementación por defecto: no cuesta, no
 * falla y explica lo que hizo. El adaptador de modelo (ia/modelo.ts) produce
 * exactamente esta misma estructura cuando hay ANTHROPIC_API_KEY.
 */
export function interpretarConReglas(
  consulta: string,
  contexto: ContextoInterprete,
): Intencion {
  const texto = normalizar(consulta);
  const intencion = intencionVacia(consulta);
  const explicacion: string[] = [];

  // 1 · Comuna nombrada explícitamente («en Puente Alto»).
  const comuna = contexto.comunas
    .map((c) => ({ ...c, n: normalizar(c.nombre) }))
    .filter((c) => texto.includes(c.n))
    .sort((a, b) => b.n.length - a.n.length)[0];

  if (comuna) {
    intencion.comunaId = comuna.id;
    intencion.comunaNombre = comuna.nombre;
    explicacion.push(`comuna: ${comuna.nombre}`);
  }

  // 2 · Cercanía relativa al usuario.
  if (MARCAS_CERCANIA.some((m) => texto.includes(m))) {
    intencion.cerca = true;
    if (!intencion.comunaId && contexto.comunaUsuarioId) {
      intencion.comunaId = contexto.comunaUsuarioId;
    }
    explicacion.push("distancia: cerca de ti");
  }

  // 3 · Disponibilidad.
  if (MARCAS_HOY.some((m) => texto.includes(m))) {
    intencion.disponibilidad = "hoy";
    explicacion.push("disponibilidad: hoy");
  } else if (MARCAS_SEMANA.some((m) => texto.includes(m))) {
    intencion.disponibilidad = "semana";
    explicacion.push("disponibilidad: esta semana");
  }

  // 4 · Tipo de actor buscado.
  const palabras = texto.split(/[^a-z0-9ñ]+/).filter(Boolean);
  for (const palabra of palabras) {
    const rol = MARCAS_ROL[palabra];
    if (rol && !intencion.roles.includes(rol)) intencion.roles.push(rol);
  }
  if (intencion.roles.length) explicacion.push(`rol: ${intencion.roles.join(", ")}`);

  // 5 · Producto o servicio.
  if (MARCAS_PRODUCTO.some((m) => texto.includes(m))) intencion.tipo = "producto";
  else if (MARCAS_SERVICIO.some((m) => texto.includes(m))) intencion.tipo = "servicio";

  // 6 · Presupuesto («hasta 50.000», «menos de $80000»).
  const presupuesto = texto.match(/(?:hasta|menos de|maximo|max)\s*\$?\s*([\d.,]+)\s*(mil|k)?/);
  if (presupuesto) {
    const crudo = presupuesto[1].replace(/[.,]/g, "");
    let valor = Number(crudo);
    if (presupuesto[2]) valor *= 1000;
    if (!Number.isNaN(valor) && valor > 0) {
      intencion.presupuestoMax = valor;
      explicacion.push(`presupuesto máximo: ${valor}`);
    }
  }

  // 7 · Categoría, por nombre o por sinónimo declarado en la taxonomía.
  //
  // Lo que se pide está en la primera frase; lo que aparece después suele ser
  // contexto («…con despacho a Ñuñoa» no convierte una compra de harina en un
  // flete). Por eso una coincidencia en el encabezado pesa mucho más.
  const corte = texto.indexOf(".");
  const encabezado = corte > 10 ? texto.slice(0, corte) : texto.slice(0, 80);

  let mejor: { id: number; nombre: string; puntaje: number } | null = null;
  for (const categoria of contexto.categorias) {
    const candidatos = [categoria.nombre, ...(categoria.sinonimos ?? [])];
    for (const candidato of candidatos) {
      const c = normalizar(candidato);
      if (!c) continue;
      const coincide = texto.includes(c) || palabras.includes(c);
      if (coincide) {
        const puntaje =
          c.length +
          (encabezado.includes(c) ? 10 : 0) +
          (categoria.tipo === intencion.tipo ? 2 : 0);
        if (!mejor || puntaje > mejor.puntaje) {
          mejor = { id: categoria.id, nombre: categoria.nombre, puntaje };
        }
      }
    }
  }
  if (mejor) {
    intencion.categoriaId = mejor.id;
    intencion.categoriaNombre = mejor.nombre;
    explicacion.push(`categoría: ${mejor.nombre}`);
  }

  // 8 · Términos libres que quedan para la búsqueda textual.
  const comunaPalabras = new Set(comuna ? normalizar(comuna.nombre).split(" ") : []);
  intencion.terminos = palabras.filter(
    (p) =>
      p.length > 2 &&
      !CONECTORES.has(p) &&
      !comunaPalabras.has(p) &&
      !MARCAS_HOY.includes(p) &&
      !(p in MARCAS_ROL),
  );

  intencion.explicacion = explicacion.length
    ? explicacion.join(" · ")
    : "búsqueda por texto en toda la comuna";

  return intencion;
}

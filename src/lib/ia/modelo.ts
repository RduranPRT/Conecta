import { interpretarConReglas } from "./reglas";
import type { ContextoInterprete, Intencion } from "./tipos";

/**
 * Adaptador de modelo de lenguaje.
 *
 * No se activa solo: si no hay ANTHROPIC_API_KEY, `interpretar` usa reglas y la
 * aplicación funciona igual. Cuando la variable existe, el modelo produce la
 * MISMA estructura `Intencion`; si falla o responde algo inválido, se cae de
 * vuelta a reglas sin que el usuario lo note.
 */

const MODELO = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";
const URL = "https://api.anthropic.com/v1/messages";

export function hayModelo() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function instrucciones(contexto: ContextoInterprete) {
  const categorias = contexto.categorias
    .map((c) => `${c.id}=${c.nombre}`)
    .join(", ");
  const comunas = contexto.comunas.map((c) => `${c.id}=${c.nombre}`).join(", ");

  return [
    "Interpretas frases de personas que buscan servicios, productos, negocios o proveedores",
    "en una plataforma territorial chilena. Devuelves SOLO un objeto JSON, sin texto alrededor.",
    "",
    "Forma exacta:",
    '{"terminos":string[],"categoriaId":number|null,"comunaId":number|null,"cerca":boolean,',
    '"disponibilidad":"hoy"|"semana"|"cualquiera","tipo":"servicio"|"producto"|"cualquiera",',
    '"roles":("persona"|"prestador"|"negocio"|"proveedor"|"productor")[],',
    '"presupuestoMax":number|null,"explicacion":string}',
    "",
    `Categorías disponibles: ${categorias}`,
    `Comunas disponibles: ${comunas}`,
    "",
    "Reglas: usa null cuando no haya evidencia; no inventes ids fuera de las listas;",
    "«cerca de mí» ⇒ cerca=true; la explicación es una línea corta en español.",
  ].join("\n");
}

export async function interpretarConModelo(
  consulta: string,
  contexto: ContextoInterprete,
): Promise<Intencion> {
  const base = interpretarConReglas(consulta, contexto);
  const clave = process.env.ANTHROPIC_API_KEY;
  if (!clave) return base;

  try {
    const respuesta = await fetch(URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": clave,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 500,
        system: instrucciones(contexto),
        messages: [{ role: "user", content: consulta }],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!respuesta.ok) return base;

    const datos = (await respuesta.json()) as { content?: { type: string; text?: string }[] };
    const texto = datos.content?.find((b) => b.type === "text")?.text ?? "";
    const json = texto.slice(texto.indexOf("{"), texto.lastIndexOf("}") + 1);
    const salida = JSON.parse(json) as Partial<Intencion>;

    const idsCategoria = new Set(contexto.categorias.map((c) => c.id));
    const idsComuna = new Set(contexto.comunas.map((c) => c.id));
    const categoriaId =
      typeof salida.categoriaId === "number" && idsCategoria.has(salida.categoriaId)
        ? salida.categoriaId
        : base.categoriaId;
    const comunaId =
      typeof salida.comunaId === "number" && idsComuna.has(salida.comunaId)
        ? salida.comunaId
        : base.comunaId;

    return {
      ...base,
      terminos: Array.isArray(salida.terminos) && salida.terminos.length
        ? salida.terminos.map(String)
        : base.terminos,
      categoriaId,
      categoriaNombre:
        contexto.categorias.find((c) => c.id === categoriaId)?.nombre ?? base.categoriaNombre,
      comunaId,
      comunaNombre: contexto.comunas.find((c) => c.id === comunaId)?.nombre ?? base.comunaNombre,
      cerca: typeof salida.cerca === "boolean" ? salida.cerca : base.cerca,
      disponibilidad: salida.disponibilidad ?? base.disponibilidad,
      tipo: salida.tipo ?? base.tipo,
      roles: Array.isArray(salida.roles) ? salida.roles : base.roles,
      presupuestoMax:
        typeof salida.presupuestoMax === "number" ? salida.presupuestoMax : base.presupuestoMax,
      motor: "modelo",
      explicacion: salida.explicacion || base.explicacion,
    };
  } catch {
    return base;
  }
}

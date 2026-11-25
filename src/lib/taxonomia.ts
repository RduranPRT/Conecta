import { normalizar } from "@/lib/utils";

/** Reglas puras de la taxonomía: qué cubre cada nivel y qué se parece a qué. */

export type NodoTaxonomia = {
  id: number;
  nivel: "rubro" | "subgrupo" | "item" | "oficio";
  tipo: "servicio" | "producto" | "ambos";
  padres: number[];
};

/**
 * Qué declaraciones de un perfil responden a una búsqueda por categoría.
 *
 * - rubro: todo lo que cuelga de él.
 * - subgrupo: él, sus ítems y sus oficios.
 * - ítem: él; y, como coincidencia amplia, quien ofrece el subgrupo completo o
 *   (si es un servicio) tiene un oficio de ese subgrupo.
 * - oficio: él; y, como coincidencia amplia, su subgrupo y los servicios de ese
 *   subgrupo: quien hace «Asesoría en contratos» aparece al buscar «abogado».
 */
export function coberturaEn(nodos: NodoTaxonomia[], categoriaId: number) {
  const porId = new Map(nodos.map((n) => [n.id, n]));
  const hijos = new Map<number, NodoTaxonomia[]>();
  for (const n of nodos) {
    for (const p of n.padres) hijos.set(p, [...(hijos.get(p) ?? []), n]);
  }

  const nodo = porId.get(categoriaId);
  if (!nodo) return { exactas: [] as number[], amplias: [] as number[] };

  const exactas = new Set<number>([nodo.id]);
  const amplias = new Set<number>();

  if (nodo.nivel === "rubro" || nodo.nivel === "subgrupo") {
    const pendientes = [nodo.id];
    while (pendientes.length) {
      for (const h of hijos.get(pendientes.pop()!) ?? []) {
        if (exactas.has(h.id)) continue;
        exactas.add(h.id);
        pendientes.push(h.id);
      }
    }
  } else {
    for (const p of nodo.padres) {
      amplias.add(p);
      for (const hermano of hijos.get(p) ?? []) {
        if (hermano.id === nodo.id) continue;
        if (nodo.nivel === "item" && nodo.tipo !== "producto" && hermano.nivel === "oficio") {
          amplias.add(hermano.id);
        }
        if (nodo.nivel === "oficio" && hermano.nivel === "item" && hermano.tipo === nodo.tipo) {
          amplias.add(hermano.id);
        }
      }
    }
  }

  return { exactas: [...exactas], amplias: [...amplias].filter((id) => !exactas.has(id)) };
}

/** Distancia de edición, acotada: basta para detectar un error de tipeo. */
function distancia(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 3) return 9;
  let previa = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const actual = [i];
    for (let j = 1; j <= b.length; j += 1) {
      actual[j] = Math.min(
        previa[j] + 1,
        actual[j - 1] + 1,
        previa[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previa = actual;
  }
  return previa[b.length];
}

/**
 * Lo más cercano a un texto que no se reconoció (S12): por trozos de palabra o
 * por errores de escritura. Vacío si nada se parece de verdad.
 */
export function sugerirCategorias<
  T extends { id: number; nombre: string; sinonimos: string[] },
>(texto: string, lista: T[], limite = 4): T[] {
  const palabras = normalizar(texto)
    .split(/[^a-z0-9ñ]+/)
    .filter((p) => p.length >= 4);
  if (!palabras.length) return [];

  const puntuadas = lista.flatMap((c) => {
    let mejor = 0;
    for (const candidato of [c.nombre, ...c.sinonimos]) {
      for (const parte of normalizar(candidato).split(/[^a-z0-9ñ]+/)) {
        if (parte.length < 4) continue;
        for (const p of palabras) {
          const raiz = Math.min(p.length, parte.length, 6);
          if (raiz >= 5 && p.slice(0, raiz) === parte.slice(0, raiz)) mejor = Math.max(mejor, 2);
          else if (p.length >= 5 && distancia(p, parte) <= (p.length >= 8 ? 2 : 1)) {
            mejor = Math.max(mejor, 3);
          }
        }
      }
    }
    return mejor ? [{ c, mejor }] : [];
  });

  return puntuadas
    .sort((a, b) => b.mejor - a.mejor || a.c.nombre.length - b.c.nombre.length)
    .slice(0, limite)
    .map((x) => x.c);
}

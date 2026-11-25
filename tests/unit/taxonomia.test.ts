import { describe, expect, it } from "vitest";

import { interpretarConReglas } from "@/lib/ia/reglas";
import type { ContextoInterprete } from "@/lib/ia/tipos";
import { coberturaEn, sugerirCategorias, type NodoTaxonomia } from "@/lib/taxonomia";
import { normalizar } from "@/lib/utils";

import { COMUNAS } from "../../scripts/datos";
import { HOJAS, ITEMS, OFICIOS, RUBROS, SUBGRUPOS } from "../../scripts/seed/taxonomia";

const TODO = [
  ...RUBROS.map((r) => ({ ...r, nivel: "rubro" as const, tipo: "ambos" as const, padres: [] as string[] })),
  ...SUBGRUPOS.map((s) => ({ ...s, nivel: "subgrupo" as const, padres: [s.rubro, ...s.tambienEn] })),
  ...HOJAS.map((h) => ({ ...h, padres: h.subgrupos })),
];
const id = (slug: string) => {
  const i = TODO.findIndex((c) => c.slug === slug);
  if (i < 0) throw new Error(`No existe ${slug}`);
  return i + 1;
};
const nodos: NodoTaxonomia[] = TODO.map((c) => ({
  id: id(c.slug),
  nivel: c.nivel,
  tipo: c.tipo,
  padres: c.padres.map(id),
}));
const contexto: ContextoInterprete = {
  categorias: TODO.map((c) => ({
    id: id(c.slug),
    slug: c.slug,
    nombre: c.nombre,
    tipo: c.tipo,
    nivel: c.nivel,
    sinonimos: c.sinonimos,
  })),
  comunas: COMUNAS.map((c, i) => ({ id: i + 1, nombre: c.nombre })),
};
const entiende = (q: string) => interpretarConReglas(q, contexto);

/** ¿Aparece alguien que declaró `declara` cuando se busca `busca`? */
function aparece(declara: string[], busca: string) {
  const categoriaId = entiende(busca).categoriaId;
  if (!categoriaId) return false;
  const { exactas, amplias } = coberturaEn(nodos, categoriaId);
  return declara.some((d) => [...exactas, ...amplias].includes(id(d)));
}

describe("semilla", () => {
  it("ningún ítem tiene dos veces el mismo nombre normalizado", () => {
    for (const lista of [ITEMS, OFICIOS, SUBGRUPOS, RUBROS]) {
      const nombres = lista.map((x) => normalizar(x.nombre));
      expect(nombres.filter((n, i) => nombres.indexOf(n) !== i)).toEqual([]);
    }
  });

  it("los slugs son únicos y caben sin cortarse", () => {
    expect(new Set(TODO.map((c) => c.slug)).size).toBe(TODO.length);
    expect(TODO.filter((c) => c.slug.length > 64)).toEqual([]);
  });

  it("todo cuelga de algo que existe, sin repetir padre", () => {
    const slugs = new Set(TODO.map((c) => c.slug));
    for (const c of TODO) {
      expect(c.padres.filter((p) => !slugs.has(p))).toEqual([]);
      expect(new Set(c.padres).size).toBe(c.padres.length);
      if (c.nivel !== "rubro") expect(c.padres.length).toBeGreaterThan(0);
    }
  });

  it("cada subgrupo tiene al menos un ítem y un ejemplo", () => {
    for (const s of SUBGRUPOS) {
      expect([s.slug, ITEMS.some((i) => i.subgrupos.includes(s.slug))]).toEqual([s.slug, true]);
      expect(s.ejemplos.length).toBeGreaterThan(5);
    }
  });

  it("conserva las 67 especialidades de octubre como subgrupos: nadie pierde su clasificación", () => {
    const deOctubre = (
      "gasfiteria electricidad climatizacion electrodomesticos cerrajeria carpinteria pintura " +
      "construccion soldadura arquitectura aseo control-plagas jardineria costura mecanica " +
      "repuestos-automotrices neumaticos electricidad-automotriz lavado-autos kinesiologia " +
      "psicologia nutricion odontologia cuidados belleza estetica masajes veterinaria " +
      "peluqueria-mascotas cuidado-mascotas productos-mascotas clases idiomas musica-arte deporte " +
      "capacitacion eventos decoracion-eventos animacion asesoria-legal contabilidad " +
      "asesoria-financiera consultoria traduccion marketing diseno-grafico fotografia audiovisual " +
      "desarrollo-web imprenta tecnologia seguridad-electronica fletes transporte-personas abarrotes " +
      "frutas-verduras panaderia carnes comida-preparada insumos-gastronomicos ferreteria materiales " +
      "envases textil artesania plantas articulos-aseo"
    ).split(" ");
    expect(deOctubre).toHaveLength(67);
    const actuales = new Set(SUBGRUPOS.map((s) => s.slug));
    expect(deOctubre.filter((s) => !actuales.has(s))).toEqual([]);
  });

  it("no copia rubros ambiguos de 2x3 y agrega lo que no tiene (C06)", () => {
    const nombres = RUBROS.map((r) => r.nombre);
    expect(nombres).not.toContain("Bienestar");
    expect(nombres).not.toContain("Artesanía");
    expect(nombres).toContain("Abastecimiento para negocios");
    expect(ITEMS.filter((i) => i.tipo === "producto").length).toBeGreaterThan(100);
  });
});

describe("quién aparece al buscar", () => {
  it("abogado con «Asesoría en contratos»", () => {
    const perfil = ["item-asesoria-en-contratos"];
    for (const q of ["abogado", "contrato", "necesito revisar un contrato", "asesoría en contratos"]) {
      expect([q, aparece(perfil, q)]).toEqual([q, true]);
    }
    const rubro = coberturaEn(nodos, id("rubro-profesionales"));
    expect(rubro.exactas).toContain(id("item-asesoria-en-contratos"));
  });

  it("electricista con varias reparaciones en un solo perfil", () => {
    const perfil = [
      "item-reparacion-de-enchufes-e-interruptores",
      "item-instalacion-de-tablero-electrico",
      "item-reparacion-de-cortes-de-luz",
    ];
    for (const q of ["electricista", "enchufe", "tablero eléctrico", "corte de luz"]) {
      expect([q, aparece(perfil, q)]).toEqual([q, true]);
    }
  });

  it("panadería sin oficio", () => {
    const perfil = ["item-marraqueta", "item-hogaza-y-pan-de-masa-madre"];
    for (const q of ["pan", "marraqueta", "marraquetas", "hogaza"]) {
      expect([q, aparece(perfil, q)]).toEqual([q, true]);
    }
  });

  it("audiovisual con fotografía, video y dron", () => {
    const perfil = ["item-fotografia-de-eventos", "item-video-para-redes-sociales", "item-grabacion-con-dron"];
    for (const q of ["fotógrafo", "video", "dron", "fotos de matrimonio"]) {
      expect([q, aparece(perfil, q)]).toEqual([q, true]);
    }
  });

  it("tienda de repuestos por producto y por rubro", () => {
    const perfil = ["item-pastillas-y-discos-de-freno", "item-filtros-de-aceite-aire-y-combustible"];
    for (const q of ["repuestos", "pastillas de freno", "filtro de aceite"]) {
      expect([q, aparece(perfil, q)]).toEqual([q, true]);
    }
    expect(coberturaEn(nodos, id("rubro-vehiculos")).exactas).toContain(
      id("item-pastillas-y-discos-de-freno"),
    );
  });

  it("quien declaró el subgrupo completo responde por cada ítem, con menos peso", () => {
    const { exactas, amplias } = coberturaEn(nodos, id("item-marraqueta"));
    expect(exactas).toEqual([id("item-marraqueta")]);
    expect(amplias).toContain(id("panaderia"));
  });

  it("un producto no trae a quien solo tiene un oficio", () => {
    const { amplias } = coberturaEn(nodos, id("item-neumaticos"));
    expect(amplias).not.toContain(id("oficio-vulcanizador"));
  });

  it("el mismo ítem se encuentra desde dos rubros sin duplicarse (C02)", () => {
    const item = id("item-mantencion-de-aire-acondicionado");
    expect(coberturaEn(nodos, id("rubro-hogar")).exactas).toContain(item);
    expect(coberturaEn(nodos, id("rubro-tecnologia")).exactas).toContain(item);
    expect(TODO.filter((c) => normalizar(c.nombre) === "mantencion de aire acondicionado")).toHaveLength(1);
  });
});

describe("intérprete con toda la taxonomía", () => {
  it("no confunde palabras con comunas («pintor» no es Pinto)", () => {
    const i = entiende("necesito un pintor para el living");
    expect(i.comunaNombre).toBeNull();
    expect(i.categoriaId).toBe(id("oficio-pintor"));
  });

  it("reconoce comuna y producto", () => {
    const i = entiende("repuestos en Rancagua");
    expect(i.comunaNombre).toBe("Rancagua");
    expect(i.categoriaId).toBe(id("repuestos-automotrices"));
  });

  it("prefiere lo concreto a lo general", () => {
    expect(entiende("lavar el auto").categoriaId).not.toBe(null);
    expect(entiende("lavado de autos").categoriaId).toBe(id("item-lavado-de-autos"));
    expect(entiende("filtro de aceite para mi auto").categoriaId).toBe(
      id("item-filtros-de-aceite-aire-y-combustible"),
    );
  });

  it("entiende lo que la gente dijo en las pruebas", () => {
    const casos: [string, string][] = [
      ["técnico de calefones", "oficio-tecnico-en-climatizacion"],
      ["reparar lavadora que no centrifuga", "item-reparacion-de-lavadoras"],
      ["busco proveedor de harina", "item-harina-por-saco"],
      ["200 cajas de tomates", "item-tomates"],
      ["plomero", "oficio-gasfiter"],
      ["contadora", "oficio-contador"],
    ];
    for (const [q, slug] of casos) expect([q, entiende(q).categoriaId]).toEqual([q, id(slug)]);
  });
});

describe("sugerencias cuando no se reconoce (S12)", () => {
  const lista = TODO.map((c) => ({ id: id(c.slug), nombre: c.nombre, sinonimos: c.sinonimos }));

  it("corrige errores de escritura", () => {
    expect(sugerirCategorias("electrisista", lista).map((c) => c.nombre).join()).toMatch(/Electric/);
    expect(sugerirCategorias("marakueta", lista).map((c) => c.nombre)).toContain("Marraqueta");
  });

  it("no inventa cuando nada se parece", () => {
    expect(sugerirCategorias("xyzqwk", lista)).toEqual([]);
    expect(sugerirCategorias("el", lista)).toEqual([]);
  });
});

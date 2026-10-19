import { describe, expect, it } from "vitest";

import { COMUNAS, ESPECIALIDADES, REGIONES, RUBROS } from "../../scripts/datos";
import { interpretarConReglas } from "./ia/reglas";
import type { ContextoInterprete } from "./ia/tipos";

describe("territorio", () => {
  it("tiene las 16 regiones y las 346 comunas de Chile, sin códigos repetidos", () => {
    expect(REGIONES).toHaveLength(16);
    expect(COMUNAS).toHaveLength(346);
    expect(new Set(COMUNAS.map((c) => c.codigo)).size).toBe(346);
    expect(COMUNAS.every((c) => REGIONES.some((r) => r.codigo === c.region))).toBe(true);
  });

  it("corrige Macul y Maipú con sus códigos CUT oficiales", () => {
    expect(COMUNAS.find((c) => c.nombre === "Macul")?.codigo).toBe("13118");
    expect(COMUNAS.find((c) => c.nombre === "Maipú")?.codigo).toBe("13119");
  });

  it("ubica cada comuna dentro de Chile (o en la Antártica)", () => {
    for (const c of COMUNAS) {
      expect(c.lat).toBeLessThan(-17);
      expect(c.lat).toBeGreaterThan(-63);
      expect(c.lng).toBeLessThan(-58);
      expect(c.lng).toBeGreaterThan(-110);
    }
  });
});

describe("taxonomía", () => {
  const slugs = [...RUBROS.map((r) => r.slug), ...ESPECIALIDADES.map((e) => e.slug)];

  it("no repite categorías (una identidad por especialidad)", () => {
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("cada especialidad apunta a rubros que existen y no se repite en su propio rubro", () => {
    const rubros = new Set(RUBROS.map((r) => r.slug));
    for (const e of ESPECIALIDADES) {
      expect(rubros.has(e.rubro)).toBe(true);
      for (const otro of e.tambienEn ?? []) {
        expect(rubros.has(otro)).toBe(true);
        expect(otro).not.toBe(e.rubro);
      }
    }
  });

  it("conserva las 30 categorías originales para no romper perfiles existentes", () => {
    const originales = [
      "gasfiteria", "electricidad", "climatizacion", "electrodomesticos", "mecanica",
      "cerrajeria", "carpinteria", "pintura", "construccion", "aseo", "jardineria", "fletes",
      "tecnologia", "contabilidad", "marketing", "belleza", "veterinaria", "clases", "eventos",
      "abarrotes", "frutas-verduras", "panaderia", "carnes", "insumos-gastronomicos",
      "materiales", "ferreteria", "envases", "textil", "artesania", "plantas",
    ];
    for (const slug of originales) expect(slugs).toContain(slug);
  });

  it("incluye lo que faltó en las pruebas de usuario", () => {
    for (const slug of [
      "repuestos-automotrices", "asesoria-legal", "asesoria-financiera", "fotografia",
      "audiovisual", "diseno-grafico",
    ]) {
      expect(slugs).toContain(slug);
    }
  });
});

describe("intérprete con todo el territorio", () => {
  const contexto: ContextoInterprete = {
    categorias: ESPECIALIDADES.map((e, i) => ({
      id: i + 1,
      slug: e.slug,
      nombre: e.nombre,
      tipo: e.tipo,
      sinonimos: [...e.sinonimos, ...(e.oficio ? [e.oficio] : [])],
    })),
    comunas: COMUNAS.map((c, i) => ({ id: i + 1, nombre: c.nombre })),
  };
  const idDe = (slug: string) => ESPECIALIDADES.findIndex((e) => e.slug === slug) + 1;

  it("no confunde palabras con nombres de comuna («pintor» no es Pinto)", () => {
    const i = interpretarConReglas("necesito un pintor para el living", contexto);
    expect(i.comunaNombre).toBeNull();
    expect(i.categoriaId).toBe(idDe("pintura"));
  });

  it("reconoce una comuna fuera de la Región Metropolitana", () => {
    const i = interpretarConReglas("repuestos en Rancagua", contexto);
    expect(i.comunaNombre).toBe("Rancagua");
    expect(i.categoriaId).toBe(idDe("repuestos-automotrices"));
  });

  it("lleva un producto concreto a su especialidad", () => {
    expect(interpretarConReglas("filtro de aceite", contexto).categoriaId).toBe(
      idDe("repuestos-automotrices"),
    );
  });

  it("lleva un oficio a su especialidad", () => {
    expect(interpretarConReglas("busco abogado para un contrato", contexto).categoriaId).toBe(
      idDe("asesoria-legal"),
    );
  });
});

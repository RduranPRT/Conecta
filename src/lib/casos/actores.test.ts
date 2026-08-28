import { describe, expect, it } from "vitest";

import { interpretarConReglas } from "@/lib/ia/reglas";
import type { ContextoInterprete } from "@/lib/ia/tipos";

import { puntuar } from "./puntaje";

const contexto: ContextoInterprete = {
  categorias: [
    {
      id: 1,
      slug: "gasfiteria",
      nombre: "Gasfitería",
      tipo: "servicio",
      sinonimos: ["gasfiter", "plomero", "filtracion"],
    },
    {
      id: 2,
      slug: "fletes",
      nombre: "Fletes y mudanzas",
      tipo: "servicio",
      sinonimos: ["flete", "despacho", "reparto"],
    },
    {
      id: 3,
      slug: "insumos",
      nombre: "Insumos gastronómicos",
      tipo: "producto",
      sinonimos: ["harina", "aceite"],
    },
  ],
  comunas: [
    { id: 10, nombre: "Ñuñoa" },
    { id: 11, nombre: "Macul" },
  ],
  comunaUsuarioId: 10,
};

describe("interpretación de una frase", () => {
  it("saca categoría, urgencia y cercanía de una frase natural", () => {
    const i = interpretarConReglas(
      "Necesito un gasfiter que pueda venir hoy cerca de mi",
      contexto,
    );
    expect(i.categoriaId).toBe(1);
    expect(i.disponibilidad).toBe("hoy");
    expect(i.cerca).toBe(true);
    expect(i.comunaId).toBe(10);
  });

  it("reconoce la comuna nombrada por encima de la del usuario", () => {
    const i = interpretarConReglas("Busco un flete en Macul", contexto);
    expect(i.comunaId).toBe(11);
    expect(i.categoriaId).toBe(2);
  });

  it("da prioridad a lo pedido en la primera frase, no al contexto posterior", () => {
    const i = interpretarConReglas(
      "Busco proveedor de harina. Necesito 20 sacos mensuales con despacho a Ñuñoa.",
      contexto,
    );
    expect(i.categoriaId).toBe(3);
  });

  it("entiende el presupuesto máximo", () => {
    const i = interpretarConReglas("Gasfiter hasta 50.000", contexto);
    expect(i.presupuestoMax).toBe(50000);
  });

  it("detecta el tipo de actor buscado", () => {
    const i = interpretarConReglas("Busco un proveedor de harina", contexto);
    expect(i.roles).toContain("proveedor");
  });
});

describe("orden de resultados", () => {
  const base = {
    distancia: 5,
    categoriaCoincide: true,
    terminoCoincide: true,
    disponibleAhora: false,
    pideHoy: false,
    reputacion: null,
    conteo: 0,
    verificado: false,
  };

  it("prefiere al más cercano en igualdad de condiciones", () => {
    const cerca = puntuar({ ...base, distancia: 2 });
    const lejos = puntuar({ ...base, distancia: 18 });
    expect(cerca.puntaje).toBeGreaterThan(lejos.puntaje);
  });

  it("prefiere a quien está disponible cuando se pide para hoy", () => {
    const disponible = puntuar({ ...base, disponibleAhora: true, pideHoy: true });
    const no = puntuar({ ...base, disponibleAhora: false, pideHoy: true });
    expect(disponible.puntaje).toBeGreaterThan(no.puntaje);
  });

  it("prefiere la categoría exacta aunque esté más lejos que una coincidencia suelta", () => {
    const exacta = puntuar({ ...base, distancia: 17, categoriaCoincide: true, pideCategoria: true });
    const suelta = puntuar({
      ...base,
      distancia: 6,
      categoriaCoincide: false,
      terminoCoincide: true,
      pideCategoria: true,
    });
    expect(exacta.puntaje).toBeGreaterThan(suelta.puntaje);
  });

  it("la verificación suma poco: no compra el primer lugar", () => {
    const verificadoLejos = puntuar({ ...base, distancia: 20, verificado: true });
    const sinVerificarCerca = puntuar({ ...base, distancia: 2 });
    expect(sinVerificarCerca.puntaje).toBeGreaterThan(verificadoLejos.puntaje);
  });

  it("no castiga a quien todavía no tiene reseñas", () => {
    const sinResenas = puntuar({ ...base, reputacion: null, conteo: 0 });
    const malEvaluado = puntuar({ ...base, reputacion: 2, conteo: 5 });
    expect(sinResenas.puntaje).toBeGreaterThan(malEvaluado.puntaje);
  });
});

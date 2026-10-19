import { describe, expect, it } from "vitest";

import { exigirRequisitos, faltantesPara } from "./requisitos";

const base = { comunaId: 1, telefono: null, identificadorFiscal: null, actividades: 0 };

describe("requisitos por acción", () => {
  it("publicar una necesidad solo exige la comuna", () => {
    expect(faltantesPara("publicar_necesidad", base)).toEqual([]);
    expect(faltantesPara("publicar_necesidad", { ...base, comunaId: null }).map((f) => f.campo)).toEqual([
      "comunaId",
    ]);
  });

  it("enviar una propuesta pide teléfono y explica para qué", () => {
    const faltan = faltantesPara("enviar_propuesta", base);
    expect(faltan.map((f) => f.campo)).toEqual(["telefono"]);
    expect(faltan[0].motivo).toMatch(/coordinar/);
    expect(faltantesPara("enviar_propuesta", { ...base, telefono: "+56912345678" })).toEqual([]);
  });

  it("publicar una oferta exige declarar qué se ofrece", () => {
    expect(faltantesPara("publicar_oferta", base).map((f) => f.campo)).toEqual(["actividad"]);
    expect(faltantesPara("publicar_oferta", { ...base, actividades: 1 })).toEqual([]);
  });

  it("el RUT solo se pide para verificar", () => {
    expect(() => exigirRequisitos("solicitar_verificacion", base)).toThrow(/rut/);
  });
});

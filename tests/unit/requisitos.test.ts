import { describe, expect, it } from "vitest";

import { exigirRequisitos, requisitosPara } from "@/lib/casos/requisitos";

/** Recién registrado: nombre, correo, clave y RUT. */
const nuevo = {
  comunaId: null,
  telefono: null,
  identificadorFiscalNorm: "12345678-5",
  actividades: 0,
};
const campos = (...args: Parameters<typeof requisitosPara>) =>
  requisitosPara(...args).map((r) => r.campo);

describe("requisitos por acción", () => {
  it("buscar, ver, guardar y contactar no piden nada a una cuenta nueva", () => {
    for (const accion of ["buscar", "ver", "guardar", "contactar"] as const) {
      expect(campos(accion, nuevo)).toEqual([]);
    }
  });

  it("publicar una necesidad pide solo la comuna", () => {
    expect(campos("publicar_necesidad", nuevo)).toEqual(["comunaId"]);
    expect(campos("publicar_necesidad", { ...nuevo, comunaId: 1 })).toEqual([]);
  });

  it("ofrecer pide comuna, actividad y teléfono; cotizar y publicar piden lo mismo", () => {
    for (const accion of ["ofrecer", "enviar_propuesta", "publicar_catalogo", "publicar_oferta"] as const) {
      expect(campos(accion, nuevo)).toEqual(["comunaId", "actividad", "telefono"]);
      expect(
        campos(accion, { ...nuevo, comunaId: 1, actividades: 1, telefono: "+56912345678" }),
      ).toEqual([]);
    }
  });

  it("a una cuenta antigua sin RUT se lo pide al actuar, no al mirar", () => {
    const antigua = { ...nuevo, identificadorFiscalNorm: null };
    expect(campos("ver", antigua)).toEqual([]);
    expect(campos("guardar", antigua)).toEqual([]);
    expect(campos("contactar", antigua)).toEqual(["identificadorFiscal"]);
    expect(campos("publicar_necesidad", antigua)).toContain("identificadorFiscal");
  });

  it("explica para qué y lanza un error legible", () => {
    expect(requisitosPara("ofrecer", nuevo).every((r) => r.motivo.length > 15)).toBe(true);
    expect(() => exigirRequisitos("enviar_propuesta", nuevo)).toThrow(/Teléfono.*coordinar/);
    expect(() => exigirRequisitos("contactar", nuevo)).not.toThrow();
  });
});

import { describe, expect, it } from "vitest";

import { digitoVerificador, esRutDeEmpresa, exigirRut, formatearRut, normalizarRut } from "@/lib/rut";

describe("RUT", () => {
  it.each([
    ["12.345.678-5", "12345678-5"],
    ["12345678-5", "12345678-5"],
    ["123456785", "12345678-5"],
    [" 12.345.678-5 ", "12345678-5"],
    ["76.086.428-5", "76086428-5"],
    ["6.000.000-k", "6000000-K"],
    ["6.000.000-1", null],
    ["11.111.111-1", "11111111-1"],
    ["012.345.678-5", "12345678-5"],
  ])("normaliza %s", (texto, esperado) => {
    expect(normalizarRut(texto)).toBe(esperado);
  });

  it("acepta la K en minúscula o mayúscula y el dígito 0", () => {
    const conK = [...Array(200).keys()].map((i) => 10_000_000 + i).find((n) => digitoVerificador(n) === "K")!;
    const conCero = [...Array(200).keys()].map((i) => 10_000_000 + i).find((n) => digitoVerificador(n) === "0")!;
    expect(normalizarRut(`${conK}-k`)).toBe(`${conK}-K`);
    expect(normalizarRut(`${conK}K`)).toBe(`${conK}-K`);
    expect(normalizarRut(`${conCero}-0`)).toBe(`${conCero}-0`);
  });

  it.each(["12.345.678-9", "1-9", "12345", "abc", "12.345.678", "", null, undefined, "12.345.678-55", "99999999999-1"])(
    "rechaza %s",
    (texto) => {
      expect(normalizarRut(texto)).toBeNull();
    },
  );

  it("formatea con puntos y guion", () => {
    expect(formatearRut("12345678-5")).toBe("12.345.678-5");
    expect(formatearRut("6789012-1")).toBe("6.789.012-1");
  });

  it("distingue persona de empresa", () => {
    expect(esRutDeEmpresa("12345678-5")).toBe(false);
    expect(esRutDeEmpresa("76086428-5")).toBe(true);
  });

  it("explica qué está mal", () => {
    expect(() => exigirRut("")).toThrow(/Escribe tu RUT/);
    expect(() => exigirRut("12.345.678-9")).toThrow(/no es válido/);
    expect(exigirRut("12.345.678-5")).toBe("12345678-5");
  });
});

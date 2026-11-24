import { describe, expect, it } from "vitest";

import { formatearTelefono, normalizarTelefono, separarTelefono } from "./telefono";

describe("teléfonos", () => {
  it("une prefijo y número escrito con espacios", () => {
    expect(normalizarTelefono("+56", "9 1234 5678")).toBe("+56912345678");
  });

  it("no duplica el prefijo si la persona también lo escribió", () => {
    expect(normalizarTelefono("+56", "+56 9 1234 5678")).toBe("+56912345678");
    expect(normalizarTelefono("+56", "56912345678")).toBe("+56912345678");
  });

  it("devuelve null cuando no hay número", () => {
    expect(normalizarTelefono("+56", "  ")).toBeNull();
  });

  it("rechaza números incompletos con un mensaje claro", () => {
    expect(() => normalizarTelefono("+56", "1234")).toThrow(/9 dígitos/);
    expect(() => normalizarTelefono("+56", "9 1234 56789")).toThrow(/9 dígitos/);
    expect(() => normalizarTelefono("+54", "1234")).toThrow(/completo/);
  });

  it("separa para editar y vuelve a formatear para mostrar", () => {
    expect(separarTelefono("+56912345678")).toEqual({ prefijo: "+56", numero: "912345678" });
    expect(separarTelefono("+56 9 5555 1001")).toEqual({ prefijo: "+56", numero: "955551001" });
    expect(formatearTelefono("+56912345678")).toBe("+56 9 1234 5678");
  });
});

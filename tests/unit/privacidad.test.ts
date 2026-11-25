import { describe, expect, it } from "vitest";

import { AVISO_CONTACTO, ocultarContacto, textoPara } from "@/lib/privacidad";

describe("ocultarContacto", () => {
  it.each([
    "Llámame al +56 9 1234 5678",
    "Llámame al 912345678",
    "Fono 9-1234-5678",
    "Fono (56) 9 1234 5678",
    "Local 2 2345 6789",
    "Escribe a ventas@panaderia.cl",
    "Más en https://panaderia.cl/menu",
    "Más en www.panaderia.cl",
    "Más en panaderia.cl",
    "Sígueme en @panaderia.sur",
    "Escríbeme por wa.me/56912345678",
    "Mira instagram.com/panaderia",
  ])("oculta el contacto en «%s»", (texto) => {
    const salida = ocultarContacto(texto);
    expect(salida).toContain(AVISO_CONTACTO);
    expect(salida).not.toMatch(/\d{4}|panaderia/);
  });

  it.each([
    "Marraqueta recién salida todos los días a las 7:30",
    "Harina panadera saco 25 kg a $24.500 por saco",
    "Presupuesto hasta $1.200.000. Atiendo desde 1998.",
    "Encargos sobre 5 kg con 20% de descuento",
    "Filtro de aceite para Yaris 2012 2014 2016",
  ])("no toca «%s»", (texto) => {
    expect(ocultarContacto(texto)).toBe(texto);
  });

  it("junta los avisos seguidos y respeta los vacíos", () => {
    expect(ocultarContacto("912345678 / 987654321")).toBe(AVISO_CONTACTO);
    expect(ocultarContacto("Fono 912345678 y correo a@b.cl hoy")).toBe(
      `Fono ${AVISO_CONTACTO} y correo ${AVISO_CONTACTO} hoy`,
    );
    expect(ocultarContacto(null)).toBeNull();
  });

  it("con sesión no cambia nada", () => {
    expect(textoPara("912345678", true)).toBe("912345678");
    expect(textoPara("912345678", false)).toBe(AVISO_CONTACTO);
  });
});

import { describe, expect, it } from "vitest";

import { conParametros, destinoSeguro, rutaIngreso } from "@/lib/destino";

describe("destinoSeguro", () => {
  it("acepta rutas internas con filtros, acción y ancla", () => {
    expect(destinoSeguro("/p/panaderia?accion=contactar")).toBe("/p/panaderia?accion=contactar");
    expect(destinoSeguro("/buscar?q=gasfiter&rol=prestador#pub-3")).toBe(
      "/buscar?q=gasfiter&rol=prestador#pub-3",
    );
  });

  it.each([
    "https://externo.com",
    "http:/externo.com",
    "//externo.com",
    "/\\externo.com",
    "\\\\externo.com",
    "/..//externo.com",
    "/./\t/externo.com",
    "javascript:alert(1)",
    "externo.com",
    " https://externo.com",
    "",
    null,
    undefined,
  ])("rechaza %s", (valor) => {
    expect(destinoSeguro(valor)).toBe("/");
  });

  it("no vuelve a las pantallas de acceso ni a la API", () => {
    expect(destinoSeguro("/ingresar?next=/x")).toBe("/");
    expect(destinoSeguro("/registro")).toBe("/");
    expect(destinoSeguro("/api/auth/sign-out")).toBe("/");
  });

  it("arma el enlace de ingreso con el retorno codificado", () => {
    expect(rutaIngreso("/p/x?accion=contactar")).toBe(
      "/ingresar?next=%2Fp%2Fx%3Faccion%3Dcontactar",
    );
    expect(rutaIngreso("https://externo.com", "/registro")).toBe("/registro");
  });

  it("agrega parámetros conservando los existentes y el ancla", () => {
    expect(conParametros("/buscar?q=pan#a", { cuenta: "lista" })).toBe(
      "/buscar?q=pan&cuenta=lista#a",
    );
  });
});

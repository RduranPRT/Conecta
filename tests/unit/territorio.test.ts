import { describe, expect, it } from "vitest";

import { abreviarRegion, filtrarComunas, nombreTerritorio } from "@/lib/territorio";

import { COMUNAS, REGIONES } from "../../scripts/datos";

const POR_REGION: Record<string, number> = {
  "15": 4, "01": 7, "02": 9, "03": 9, "04": 15, "05": 38, "13": 52, "06": 33,
  "07": 30, "16": 21, "08": 33, "09": 32, "14": 12, "10": 30, "11": 10, "12": 11,
};

const buscables = COMUNAS.map((c) => ({
  nombre: c.nombre,
  regionNombre: REGIONES.find((r) => r.codigo === c.region)!.nombre,
}));
const buscar = (q: string) => filtrarComunas(buscables, q).map((c) => c.nombre);

describe("catálogo territorial", () => {
  it("tiene 16 regiones y 346 comunas únicas", () => {
    expect(new Set(REGIONES.map((r) => r.codigo)).size).toBe(16);
    expect(new Set(COMUNAS.map((c) => c.codigo)).size).toBe(346);
  });

  it("cada región tiene su número oficial de comunas y el CUT lleva su prefijo", () => {
    for (const [region, total] of Object.entries(POR_REGION)) {
      const propias = COMUNAS.filter((c) => c.region === region);
      expect([region, propias.length]).toEqual([region, total]);
      expect(propias.every((c) => /^\d{5}$/.test(c.codigo) && c.codigo.startsWith(region))).toBe(true);
    }
  });

  it("no repite nombres dentro de una región", () => {
    expect(new Set(COMUNAS.map((c) => `${c.region}|${c.nombre}`)).size).toBe(346);
  });
});

describe("búsqueda de comunas", () => {
  it("no distingue tildes ni mayúsculas", () => {
    expect(buscar("nunoa")[0]).toBe("Ñuñoa");
    expect(buscar("ÑUÑOA")[0]).toBe("Ñuñoa");
    expect(buscar("chillan").slice(0, 2)).toEqual(["Chillán", "Chillán Viejo"]);
    expect(buscar("putre")).toEqual(["Putre"]);
  });

  it("encuentra por el nombre con que se conoce la localidad", () => {
    expect(buscar("puerto williams")).toEqual(["Cabo de Hornos"]);
    expect(buscar("rapa nui")).toEqual(["Isla de Pascua"]);
  });

  it("encuentra por región y devuelve vacío si no existe", () => {
    expect(buscar("ohiggins")).toContain("Rancagua");
    expect(buscar("zzz")).toEqual([]);
  });

  it("nombra corto el territorio", () => {
    expect(nombreTerritorio("Ñuñoa", "Región Metropolitana de Santiago")).toBe("Ñuñoa, RM");
    expect(abreviarRegion("Región del Biobío")).toBe("Biobío");
    expect(abreviarRegion("Región de La Araucanía")).toBe("La Araucanía");
    expect(abreviarRegion("Región de Los Lagos")).toBe("Los Lagos");
  });
});

/**
 * Genera docs/taxonomia-para-revision.md desde la semilla, para que Álvaro la
 * revise sin leer código. `npm run taxonomia:exportar`.
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { HOJAS, ITEMS, OFICIOS, RUBROS, SUBGRUPOS, type HojaSemilla } from "./seed/taxonomia";

const nombreSubgrupo = new Map(SUBGRUPOS.map((s) => [s.slug, s.nombre]));
const nombreRubro = new Map(RUBROS.map((r) => [r.slug, r.nombre]));

function celda(hoja: HojaSemilla, desde: string) {
  const tambien = hoja.subgrupos.filter((s) => s !== desde).map((s) => nombreSubgrupo.get(s));
  return `${hoja.nombre}${tambien.length ? ` *(también en ${tambien.join(", ")})*` : ""}`;
}

const lineas: string[] = [
  "# Taxonomía de Conecta · para revisión",
  "",
  "**Estado: propuesta.** La valida Álvaro. Este archivo se genera solo desde",
  "`scripts/seed/taxonomia.ts`: no lo edites aquí, anota los cambios y se llevan a la semilla.",
  "",
  `**En números:** ${RUBROS.length} rubros · ${SUBGRUPOS.length} subgrupos · ${ITEMS.length} ítems ` +
    `(${ITEMS.filter((i) => i.tipo === "servicio").length} servicios y ` +
    `${ITEMS.filter((i) => i.tipo === "producto").length} productos) · ${OFICIOS.length} oficios.`,
  "",
  "## Cómo leerla",
  "",
  "- **Rubro:** el área grande. **Subgrupo:** el tema dentro del rubro.",
  "- **Ítem:** lo concreto que alguien ofrece o busca. Existe una sola vez, aunque se encuentre",
  "  desde varios lugares.",
  "- **Oficio:** quién hace el trabajo. Es otra forma de buscar y nunca es obligatorio.",
  "- **Se encuentra también como:** palabras que la gente usa y que llevan al mismo lugar.",
  "",
  "## Qué revisar",
  "",
  "1. ¿Falta algún rubro, subgrupo, servicio o producto que hayas visto en las pruebas?",
  "2. ¿Algún nombre no se entiende o la gente lo dice de otra forma?",
  "3. ¿Algo está en un lugar donde nadie lo buscaría?",
  "4. ¿Sobra algo que hoy no tiene sentido ofrecer?",
  "",
  "## De dónde sale cada rubro (referencia 2x3)",
  "",
  "| Rubro de 2x3 | En Conecta |",
  "|---|---|",
  "| Hogar & Oficina | Hogar y oficina |",
  "| Bienestar | Se separa en Salud · Belleza y cuidado personal · Experiencias y tiempo libre |",
  "| Mascotas | Mascotas (suma alimento y accesorios) |",
  "| Transporte & Flete | Transporte y fletes |",
  "| Clases | Clases y capacitación |",
  "| Eventos | Eventos y celebraciones |",
  "| Artesanía | Se reparte: carpintería y costura en Hogar; tatuajes en Belleza; joyas y hecho a mano en Tiendas |",
  "| Digital & Creativo | Digital y creativo |",
  "| Empresa & Legal | Empresa y legal |",
  "| Soporte Técnico | Soporte técnico |",
  "| Vehículos | Automotriz (suma repuestos por especialidad) |",
  "| *(no existe)* | Alimentos y bebidas · Tiendas y productos · Abastecimiento para negocios |",
  "",
];

for (const rubro of RUBROS) {
  lineas.push(`## ${rubro.icono} ${rubro.nombre}`, "", `*${rubro.ejemplos}*`, "");
  lineas.push("| Subgrupo | Servicios | Productos | Oficios | Se encuentra también como |", "|---|---|---|---|---|");
  for (const s of SUBGRUPOS.filter((x) => x.rubro === rubro.slug)) {
    const hojas = HOJAS.filter((h) => h.subgrupos[0] === s.slug);
    const lista = (f: (h: HojaSemilla) => boolean) =>
      hojas.filter(f).map((h) => celda(h, s.slug)).join("<br>") || "—";
    lineas.push(
      `| **${s.nombre}**${s.tambienEn.length ? `<br>*También en ${s.tambienEn.map((t) => nombreRubro.get(t)).join(", ")}*` : ""} ` +
        `| ${lista((h) => h.nivel === "item" && h.tipo === "servicio")} ` +
        `| ${lista((h) => h.nivel === "item" && h.tipo === "producto")} ` +
        `| ${lista((h) => h.nivel === "oficio")} ` +
        `| ${[...s.sinonimos, ...hojas.flatMap((h) => h.sinonimos)].join(", ")} |`,
    );
  }
  const ajenos = SUBGRUPOS.filter((x) => x.tambienEn.includes(rubro.slug));
  if (ajenos.length) {
    lineas.push(
      "",
      `Desde aquí también se llega a: ${ajenos.map((a) => `${a.nombre} (${nombreRubro.get(a.rubro)})`).join(" · ")}.`,
    );
  }
  lineas.push("");
}

mkdirSync("docs", { recursive: true });
writeFileSync("docs/taxonomia-para-revision.md", `${lineas.join("\n").trimEnd()}\n`);
console.log("· docs/taxonomia-para-revision.md generado");

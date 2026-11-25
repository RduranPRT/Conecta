/**
 * Catálogos de referencia: territorio, taxonomía y agentes.
 *
 * Es idempotente y no toca datos de usuarios, así que corre en cada despliegue
 * después de las migraciones (ver railway.json). Así una base con perfiles
 * reales recibe comunas y categorías nuevas sin pasar por el seed.
 */
import "dotenv/config";

import { and, eq, inArray, isNotNull, isNull, notInArray, sql } from "drizzle-orm";

import { db } from "../src/db";
import {
  agentes,
  categoriaPadres,
  categorias,
  comunas,
  paises,
  perfiles,
  regiones,
  solicitudesCategoria,
} from "../src/db/schema";

import { normalizarRut } from "../src/lib/rut";

import { AGENTES, COMUNAS, REGIONES } from "./datos";
import { HOJAS, RUBROS, SUBGRUPOS } from "./seed/taxonomia";

const paso = (texto: string) => console.log(`· ${texto}`);

export async function cargarCatalogos() {
  /* 1 · Territorio */
  const [chile] = await db
    .insert(paises)
    .values({ codigo: "CL", nombre: "Chile", moneda: "CLP", prefijoTelefono: "+56" })
    .onConflictDoUpdate({
      target: paises.codigo,
      set: { nombre: "Chile", prefijoTelefono: "+56" },
    })
    .returning();

  const idRegion = new Map<string, number>();
  for (const region of REGIONES) {
    const [fila] = await db
      .insert(regiones)
      .values({ paisId: chile.id, ...region })
      .onConflictDoUpdate({
        target: [regiones.paisId, regiones.codigo],
        set: { nombre: region.nombre, orden: region.orden },
      })
      .returning();
    idRegion.set(region.codigo, fila.id);
  }

  // Corrección de datos de la primera versión: Macul tenía el código CUT de
  // Maipú (13119) y Maipú uno inventado (13119b). Se corrige en el lugar para
  // no duplicar comunas ni romper los perfiles que ya apuntan a ellas.
  await db.execute(sql`
    update comunas set codigo = '13118'
    where codigo = '13119' and nombre = 'Macul'
      and not exists (select 1 from comunas where codigo = '13118')`);
  await db.execute(sql`
    update comunas set codigo = '13119'
    where codigo = '13119b'
      and not exists (select 1 from comunas where codigo = '13119')`);

  const idComuna = new Map<string, number>();
  const puntoComuna = new Map<string, { lat: number; lng: number }>();
  for (const comuna of COMUNAS) {
    const [fila] = await db
      .insert(comunas)
      .values({
        regionId: idRegion.get(comuna.region)!,
        codigo: comuna.codigo,
        nombre: comuna.nombre,
        lat: comuna.lat,
        lng: comuna.lng,
        activa: comuna.activa,
      })
      .onConflictDoUpdate({
        target: [comunas.regionId, comunas.codigo],
        set: { nombre: comuna.nombre, lat: comuna.lat, lng: comuna.lng, activa: comuna.activa },
      })
      .returning();
    idComuna.set(comuna.nombre, fila.id);
    puntoComuna.set(comuna.nombre, { lat: comuna.lat, lng: comuna.lng });
  }
  paso(`territorio: ${REGIONES.length} regiones, ${COMUNAS.length} comunas`);

  /* 2 · Taxonomía: rubro → subgrupo → ítem, y oficios */
  const idCategoria = new Map<string, number>();
  type Fila = typeof categorias.$inferInsert;
  async function guardar(valores: Fila) {
    const [fila] = await db
      .insert(categorias)
      .values(valores)
      .onConflictDoUpdate({ target: categorias.slug, set: valores })
      .returning({ id: categorias.id });
    idCategoria.set(valores.slug, fila.id);
    return fila.id;
  }

  for (const [i, rubro] of RUBROS.entries()) {
    await guardar({ ...rubro, tipo: "ambos", nivel: "rubro", origen: "semilla", padreId: null, orden: i });
  }

  const aristas: { categoriaId: number; padreId: number }[] = [];
  const padre = (slug: string) => {
    const id = idCategoria.get(slug);
    if (!id) throw new Error(`La taxonomía apunta a «${slug}», que no existe.`);
    return id;
  };

  for (const [i, s] of SUBGRUPOS.entries()) {
    const id = await guardar({
      slug: s.slug,
      nombre: s.nombre,
      tipo: s.tipo,
      nivel: "subgrupo",
      origen: "semilla",
      padreId: padre(s.rubro),
      icono: null,
      ejemplos: s.ejemplos,
      sinonimos: s.sinonimos,
      orden: 100 + i,
    });
    for (const r of [s.rubro, ...s.tambienEn]) aristas.push({ categoriaId: id, padreId: padre(r) });
  }

  for (const [i, h] of HOJAS.entries()) {
    const id = await guardar({
      slug: h.slug,
      nombre: h.nombre,
      tipo: h.tipo,
      nivel: h.nivel,
      // Si administración lo creó antes con el mismo nombre, pasa a la semilla.
      origen: "semilla",
      padreId: padre(h.subgrupos[0]),
      icono: null,
      ejemplos: null,
      sinonimos: h.sinonimos,
      orden: 1000 + i,
    });
    for (const s of h.subgrupos) aristas.push({ categoriaId: id, padreId: padre(s) });
  }

  // Las relaciones de la semilla se reemplazan; las creadas desde
  // administración (`origen = admin`) no se tocan.
  await db.transaction(async (tx) => {
    await tx
      .delete(categoriaPadres)
      .where(inArray(categoriaPadres.categoriaId, [...new Set(aristas.map((a) => a.categoriaId))]));
    await tx.insert(categoriaPadres).values(aristas).onConflictDoNothing();
  });

  // Una categoría sin padre que ya no está en la taxonomía (creada a mano o
  // heredada) queda como subgrupo de Tiendas y productos, no como rubro suelto:
  // así nadie se queda sin clasificar.
  const huerfanas = await db
    .update(categorias)
    .set({ padreId: padre("rubro-comercio"), nivel: "subgrupo" })
    .where(
      and(
        isNull(categorias.padreId),
        notInArray(categorias.slug, RUBROS.map((r) => r.slug)),
      ),
    )
    .returning({ id: categorias.id });
  if (huerfanas.length) {
    await db
      .insert(categoriaPadres)
      .values(huerfanas.map((h) => ({ categoriaId: h.id, padreId: padre("rubro-comercio") })))
      .onConflictDoNothing();
  }

  // Estados de «Otro» de la primera versión.
  for (const [antes, ahora] of [
    ["asignada", "fusionada"],
    ["descartada", "rechazada"],
  ] as const) {
    await db
      .update(solicitudesCategoria)
      .set({ estado: ahora })
      .where(eq(solicitudesCategoria.estado, antes));
  }

  const items = HOJAS.filter((h) => h.nivel === "item").length;
  paso(
    `taxonomía: ${RUBROS.length} rubros, ${SUBGRUPOS.length} subgrupos, ${items} ítems y ${HOJAS.length - items} oficios`,
  );

  await normalizarRutHeredados();

  /* 3 · Catálogo de agentes */
  for (const agente of AGENTES) {
    await db
      .insert(agentes)
      .values(agente)
      .onConflictDoUpdate({ target: agentes.codigo, set: { nombre: agente.nombre } });
  }
  paso(`agentes: ${AGENTES.length} en catálogo`);

  return { idComuna, puntoComuna, idCategoria };
}

/**
 * Cuentas anteriores a nov-2026: llena el RUT normalizado solo si el que tienen
 * es válido y no se repite. No cambia lo que escribieron; a quien le falte se
 * le pide al intentar una acción.
 */
async function normalizarRutHeredados() {
  const filas = await db
    .select({ id: perfiles.id, rut: perfiles.identificadorFiscal })
    .from(perfiles)
    .where(and(isNull(perfiles.identificadorFiscalNorm), isNotNull(perfiles.identificadorFiscal)))
    .orderBy(perfiles.id);
  let listos = 0;
  for (const fila of filas) {
    const norm = normalizarRut(fila.rut);
    if (!norm) continue;
    const ocupado = await db.query.perfiles.findFirst({
      where: eq(perfiles.identificadorFiscalNorm, norm),
      columns: { id: true },
    });
    if (ocupado) continue;
    await db.update(perfiles).set({ identificadorFiscalNorm: norm }).where(eq(perfiles.id, fila.id));
    listos += 1;
  }
  if (filas.length) paso(`RUT heredados: ${listos} de ${filas.length} válidos`);
}

// Ejecución directa: `npm run db:catalogos`.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/catalogos.ts")) {
  cargarCatalogos()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

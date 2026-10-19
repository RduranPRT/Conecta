/**
 * Catálogos de referencia: territorio, taxonomía y agentes.
 *
 * Es idempotente y no toca datos de usuarios, así que corre en cada despliegue
 * después de las migraciones (ver railway.json). Así una base con perfiles
 * reales recibe comunas y categorías nuevas sin pasar por el seed.
 */
import "dotenv/config";

import { and, inArray, isNull, notInArray, sql } from "drizzle-orm";

import { db } from "../src/db";
import { agentes, categoriaRubros, categorias, comunas, paises, regiones } from "../src/db/schema";

import { AGENTES, COMUNAS, ESPECIALIDADES, REGIONES, RUBROS } from "./datos";

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

  /* 2 · Taxonomía: rubros, especialidades y rubros secundarios */
  const idCategoria = new Map<string, number>();
  for (const [i, rubro] of RUBROS.entries()) {
    const valores = {
      slug: rubro.slug,
      nombre: rubro.nombre,
      tipo: "ambos" as const,
      padreId: null,
      icono: rubro.icono,
      oficio: null,
      ejemplos: rubro.ejemplos,
      sinonimos: rubro.sinonimos,
      orden: i,
    };
    const [fila] = await db
      .insert(categorias)
      .values(valores)
      .onConflictDoUpdate({ target: categorias.slug, set: valores })
      .returning();
    idCategoria.set(rubro.slug, fila.id);
  }

  for (const [i, esp] of ESPECIALIDADES.entries()) {
    const padreId = idCategoria.get(esp.rubro);
    if (!padreId) throw new Error(`La especialidad ${esp.slug} apunta a un rubro inexistente.`);
    const valores = {
      slug: esp.slug,
      nombre: esp.nombre,
      tipo: esp.tipo,
      padreId,
      icono: null,
      oficio: esp.oficio ?? null,
      ejemplos: esp.ejemplos ?? null,
      sinonimos: esp.sinonimos,
      orden: i,
    };
    const [fila] = await db
      .insert(categorias)
      .values(valores)
      .onConflictDoUpdate({ target: categorias.slug, set: valores })
      .returning();
    idCategoria.set(esp.slug, fila.id);
  }

  const relaciones = ESPECIALIDADES.flatMap((esp) =>
    (esp.tambienEn ?? []).map((rubro) => ({
      categoriaId: idCategoria.get(esp.slug)!,
      rubroId: idCategoria.get(rubro)!,
    })),
  );
  const idsEspecialidades = ESPECIALIDADES.map((e) => idCategoria.get(e.slug)!);
  await db.transaction(async (tx) => {
    await tx.delete(categoriaRubros).where(inArray(categoriaRubros.categoriaId, idsEspecialidades));
    if (relaciones.length) await tx.insert(categoriaRubros).values(relaciones);
  });

  // Una categoría que ya no está en la taxonomía (creada a mano o heredada)
  // queda colgando del rubro de comercio en vez de aparecer como rubro suelto.
  const slugsVigentes = [...RUBROS.map((r) => r.slug), ...ESPECIALIDADES.map((e) => e.slug)];
  await db
    .update(categorias)
    .set({ padreId: idCategoria.get("rubro-comercio")! })
    .where(and(isNull(categorias.padreId), notInArray(categorias.slug, slugsVigentes)));

  paso(`taxonomía: ${RUBROS.length} rubros, ${ESPECIALIDADES.length} especialidades`);

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

// Ejecución directa: `npm run db:catalogos`.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/catalogos.ts")) {
  cargarCatalogos()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

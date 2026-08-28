/**
 * Datos semilla del prototipo.
 *
 * No inserta a mano el resultado de las reglas: publica necesidades, cotiza,
 * adjudica y califica llamando a los MISMOS casos de uso que usa la interfaz.
 * Si una regla se rompe, el seed falla —que es exactamente lo que se quiere.
 */
import "dotenv/config";

import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { eq, sql } from "drizzle-orm";

import { db } from "../src/db";
import {
  account,
  EMISOR_CREDENCIAL,
  agentes,
  categorias,
  coberturas,
  comunas,
  items,
  paises,
  perfilCategorias,
  perfilRoles,
  perfiles,
  publicaciones,
  regiones,
  user,
  verificaciones,
} from "../src/db/schema";
import { publicarNecesidad } from "../src/lib/casos/necesidades";
import {
  adjudicar,
  calificar,
  enviarPropuesta,
  registrarEntrega,
} from "../src/lib/casos/propuestas";

import { ACTORES, CLAVE_DEMO } from "./actores";
import { AGENTES, CATEGORIAS, COMUNAS, REGIONES } from "./datos";

const paso = (texto: string) => console.log(`· ${texto}`);

/** Dispersa los puntos alrededor del centro de la comuna: el mapa se ve real. */
function jitter(base: number, escala = 0.014) {
  return base + (Math.random() - 0.5) * escala;
}

async function main() {
  const yaHay = await db.select({ total: sql<number>`count(*)::int` }).from(perfiles);
  if (Number(yaHay[0]?.total ?? 0) > 0 && !process.argv.includes("--forzar")) {
    console.log("La base ya tiene perfiles. Usa `npm run db:seed -- --forzar` para agregar igual.");
    process.exit(0);
  }

  /* 1 · Territorio */
  const [chile] = await db
    .insert(paises)
    .values({ codigo: "CL", nombre: "Chile", moneda: "CLP", prefijoTelefono: "+56" })
    .onConflictDoUpdate({ target: paises.codigo, set: { nombre: "Chile" } })
    .returning();

  const idRegion = new Map<string, number>();
  for (const region of REGIONES) {
    const [fila] = await db
      .insert(regiones)
      .values({ paisId: chile.id, ...region })
      .onConflictDoUpdate({
        target: [regiones.paisId, regiones.codigo],
        set: { nombre: region.nombre },
      })
      .returning();
    idRegion.set(region.codigo, fila.id);
  }

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
        activa: comuna.activa ?? false,
      })
      .onConflictDoUpdate({
        target: [comunas.regionId, comunas.codigo],
        set: { nombre: comuna.nombre, activa: comuna.activa ?? false },
      })
      .returning();
    idComuna.set(comuna.nombre, fila.id);
    puntoComuna.set(comuna.nombre, { lat: comuna.lat, lng: comuna.lng });
  }
  paso(`territorio: ${REGIONES.length} regiones, ${COMUNAS.length} comunas`);

  /* 2 · Taxonomía */
  const idCategoria = new Map<string, number>();
  for (const [i, categoria] of CATEGORIAS.entries()) {
    const [fila] = await db
      .insert(categorias)
      .values({ ...categoria, orden: i })
      .onConflictDoUpdate({
        target: categorias.slug,
        set: { nombre: categoria.nombre, sinonimos: categoria.sinonimos },
      })
      .returning();
    idCategoria.set(categoria.slug, fila.id);
  }
  paso(`taxonomía: ${CATEGORIAS.length} categorías`);

  /* 3 · Catálogo de agentes */
  for (const agente of AGENTES) {
    await db
      .insert(agentes)
      .values(agente)
      .onConflictDoUpdate({ target: agentes.codigo, set: { nombre: agente.nombre } });
  }
  paso(`agentes: ${AGENTES.length} en catálogo`);

  /* 4 · Identidades con cuenta real */
  const clave = await hashPassword(CLAVE_DEMO);
  const idPerfil = new Map<string, number>();

  for (const actor of ACTORES) {
    const ahora = new Date();
    const usuarioId = randomUUID();
    const correo = `${actor.slug}@conecta.demo`;

    await db.insert(user).values({
      id: usuarioId,
      name: actor.nombre,
      email: correo,
      emailVerified: true,
      createdAt: ahora,
      updatedAt: ahora,
    });

    await db.insert(account).values({
      id: randomUUID(),
      issuer: EMISOR_CREDENCIAL,
      accountId: usuarioId,
      providerId: "credential",
      userId: usuarioId,
      password: clave,
      createdAt: ahora,
      updatedAt: ahora,
    });

    const centro = puntoComuna.get(actor.comuna)!;
    const [perfil] = await db
      .insert(perfiles)
      .values({
        usuarioId,
        slug: actor.slug,
        nombre: actor.nombre,
        descripcion: actor.descripcion,
        identificadorFiscal: `7${Math.floor(1000000 + Math.random() * 8999999)}-${Math.floor(
          Math.random() * 9,
        )}`,
        telefono: actor.telefono ?? null,
        correoPublico: correo,
        comunaId: idComuna.get(actor.comuna)!,
        lat: jitter(centro.lat),
        lng: jitter(centro.lng),
        radioKm: actor.radioKm ?? null,
        disponibleAhora: actor.disponible ?? false,
        disponibleHasta: actor.disponible ? new Date(Date.now() + 8 * 3_600_000) : null,
      })
      .returning();

    idPerfil.set(actor.slug, perfil.id);

    await db
      .insert(perfilRoles)
      .values(actor.roles.map((rol) => ({ perfilId: perfil.id, rol })))
      .onConflictDoNothing();

    if (actor.categorias.length) {
      await db
        .insert(perfilCategorias)
        .values(
          actor.categorias.map((slug, i) => ({
            perfilId: perfil.id,
            categoriaId: idCategoria.get(slug)!,
            principal: i === 0,
          })),
        )
        .onConflictDoNothing();
    }

    const cobertura = actor.cobertura?.length ? actor.cobertura : [actor.comuna];
    await db
      .insert(coberturas)
      .values(cobertura.map((nombre) => ({ perfilId: perfil.id, comunaId: idComuna.get(nombre)! })))
      .onConflictDoNothing();

    if (actor.verificado) {
      await db
        .insert(verificaciones)
        .values({
          perfilId: perfil.id,
          tipo: actor.roles.includes("prestador") ? "prestador" : "negocio",
          estado: "verificado",
          resueltoEn: new Date(),
        })
        .onConflictDoNothing();
    }

    if (actor.catalogo?.length) {
      await db.insert(items).values(
        actor.catalogo.map((item) => ({
          perfilId: perfil.id,
          nombre: item.nombre,
          descripcion: item.descripcion ?? null,
          precio: item.precio?.toString() ?? null,
          unidad: item.unidad ?? null,
          categoriaId: idCategoria.get(actor.categorias[0] ?? "") ?? null,
          tipo: "producto" as const,
        })),
      );
    }
  }
  paso(`identidades: ${ACTORES.length} perfiles con cuenta (clave: ${CLAVE_DEMO})`);

  /* 5 · Dos verificaciones pendientes, para que el Centro de Control tenga cola */
  await db
    .insert(verificaciones)
    .values([
      { perfilId: idPerfil.get("clima-center")!, tipo: "negocio", estado: "pendiente" },
      {
        perfilId: idPerfil.get("cerrajeria-express")!,
        tipo: "identidad",
        estado: "pendiente",
      },
    ])
    .onConflictDoNothing();

  /* 6 · Feed */
  const feed = [
    {
      autor: "panaderia-dona-rosa",
      tipo: "oferta" as const,
      titulo: "Marraqueta recién salida todos los días a las 7:30",
      cuerpo: "Encargos sobre 5 kg con 20% de descuento para locales del barrio.",
      categoria: "panaderia",
      precio: 2800,
    },
    {
      autor: "verduras-del-valle",
      tipo: "producto" as const,
      titulo: "Tomate de invernadero por caja de 15 kg",
      cuerpo: "Cosecha de esta semana. Despacho propio a Santiago centro y comunas del sector.",
      categoria: "frutas-verduras",
      precio: 12000,
    },
    {
      autor: "distribuidora-el-molino",
      tipo: "producto" as const,
      titulo: "Harina panadera saco 25 kg · precio de lista actualizado",
      cuerpo: "Sobre 10 sacos, despacho sin costo dentro de la Región Metropolitana.",
      categoria: "insumos-gastronomicos",
      precio: 24500,
    },
    {
      autor: "gasfiteria-aguasur",
      tipo: "servicio" as const,
      titulo: "Detección de filtraciones sin romper muros",
      cuerpo: "Equipo de detección acústica. Visita en el día dentro de Ñuñoa y Macul.",
      categoria: "gasfiteria",
      precio: 35000,
    },
    {
      autor: "servitec-linea-blanca",
      tipo: "servicio" as const,
      titulo: "Reparación de lavadoras a domicilio",
      cuerpo: "Diagnóstico sin costo si aceptas la reparación. Garantía de 3 meses.",
      categoria: "electrodomesticos",
    },
    {
      autor: "estudio-marca",
      tipo: "oferta" as const,
      titulo: "Pack de identidad para pymes del barrio",
      cuerpo: "Logo, paleta y 10 plantillas de redes. Cupos limitados este mes.",
      categoria: "marketing",
      precio: 290000,
    },
    {
      autor: "fletes-don-nano",
      tipo: "servicio" as const,
      titulo: "Flete con ayudante, disponible hoy en la tarde",
      cuerpo: "Camioneta 3/4. Reparto por hora o por viaje.",
      categoria: "fletes",
      precio: 25000,
    },
    {
      autor: "vivero-las-encinas",
      tipo: "novedad" as const,
      titulo: "Llegaron los cítricos en maceta",
      cuerpo: "Limoneros y naranjos de dos años, listos para patio.",
      categoria: "plantas",
    },
    {
      autor: "textil-andes",
      tipo: "producto" as const,
      titulo: "Uniformes bordados desde 20 unidades",
      cuerpo: "Polera piqué y delantal. Entrega en 10 días hábiles.",
      categoria: "textil",
      precio: 14900,
    },
    {
      autor: "banqueteria-tres-fuegos",
      tipo: "oferta" as const,
      titulo: "Menú de fiestas patrias para empresas",
      cuerpo: "Desde 30 personas, con montaje y servicio incluido.",
      categoria: "eventos",
    },
  ];

  for (const p of feed) {
    const perfilId = idPerfil.get(p.autor)!;
    const perfil = await db.query.perfiles.findFirst({ where: eq(perfiles.id, perfilId) });
    await db.insert(publicaciones).values({
      autorPerfilId: perfilId,
      tipo: p.tipo,
      titulo: p.titulo,
      cuerpo: p.cuerpo,
      categoriaId: idCategoria.get(p.categoria) ?? null,
      comunaId: perfil?.comunaId ?? null,
      precio: p.precio?.toString() ?? null,
      // Una sola publicación patrocinada: alcanza para ver la regla de mezcla.
      patrocinado: p.autor === "estudio-marca",
      patrocinioHasta: p.autor === "estudio-marca" ? new Date(Date.now() + 3 * 86_400_000) : null,
      patrocinioRadioKm: p.autor === "estudio-marca" ? 10 : null,
    });
  }
  paso(`feed: ${feed.length} publicaciones`);

  /* 7 · Necesidades, propuestas y un ciclo completo — vía casos de uso */

  // 7.1 · Ciclo completo: publicada → cotizada → adjudicada → entregada → calificada.
  const lavadora = await publicarNecesidad({
    solicitantePerfilId: idPerfil.get("rodrigo-fuentes")!,
    titulo: "Reparar lavadora que no centrifuga",
    descripcion:
      "Lavadora Samsung de carga frontal, 8 kg. Lava pero no centrifuga y queda con agua. La necesito andando esta semana, atiendo en Ñuñoa.",
    urgencia: "semana",
  });

  const p1 = await enviarPropuesta({
    necesidadId: lavadora.necesidad.id,
    perfilId: idPerfil.get("servitec-linea-blanca")!,
    monto: 42000,
    plazoDias: 2,
    mensaje: "Visita, diagnóstico, cambio de bomba de desagüe y garantía de 3 meses.",
  });
  await enviarPropuesta({
    necesidadId: lavadora.necesidad.id,
    perfilId: idPerfil.get("electro-hogar-vega")!,
    monto: 55000,
    plazoDias: 1,
    mensaje: "Atención mañana mismo, repuesto original y garantía de 6 meses.",
  });

  const operacion = await adjudicar({
    necesidadId: lavadora.necesidad.id,
    propuestaId: p1.id,
    actorPerfilId: idPerfil.get("rodrigo-fuentes")!,
  });
  await registrarEntrega({
    operacionId: operacion.id,
    actorPerfilId: idPerfil.get("servitec-linea-blanca")!,
  });
  await calificar({
    operacionId: operacion.id,
    autorPerfilId: idPerfil.get("rodrigo-fuentes")!,
    puntaje: 5,
    comentario: "Llegó a la hora, explicó el problema y dejó la lavadora andando. Recomendado.",
  });
  await calificar({
    operacionId: operacion.id,
    autorPerfilId: idPerfil.get("servitec-linea-blanca")!,
    puntaje: 5,
    comentario: "Cliente claro con la información y el acceso. Todo en orden.",
  });

  // 7.2 · En cotización, con propuestas comparables.
  const harina = await publicarNecesidad({
    solicitantePerfilId: idPerfil.get("panaderia-dona-rosa")!,
    titulo: "Busco proveedor de harina, 20 sacos al mes",
    descripcion:
      "Necesito harina panadera de 25 kg, 20 sacos mensuales con despacho a Ñuñoa. Busco precio por volumen y pago a 15 días.",
    urgencia: "mes",
  });
  await enviarPropuesta({
    necesidadId: harina.necesidad.id,
    perfilId: idPerfil.get("distribuidora-el-molino")!,
    monto: 23800,
    plazoDias: 3,
    mensaje: "Precio por saco con despacho incluido sobre 10 sacos. Pago a 15 días aprobado.",
  });

  const gasfiter = await publicarNecesidad({
    solicitantePerfilId: idPerfil.get("rodrigo-fuentes")!,
    titulo: "Necesito un gasfíter hoy, tengo una filtración bajo el lavaplatos",
    descripcion:
      "Se está filtrando agua bajo el mueble de cocina y el piso se está mojando. Necesito que alguien pueda venir hoy mismo a Ñuñoa.",
    urgencia: "hoy",
  });
  await enviarPropuesta({
    necesidadId: gasfiter.necesidad.id,
    perfilId: idPerfil.get("gasfiteria-aguasur")!,
    monto: 38000,
    plazoDias: 1,
    mensaje: "Puedo llegar hoy entre 16:00 y 18:00. Incluye visita, sello y cambio de sifón.",
  });
  await enviarPropuesta({
    necesidadId: gasfiter.necesidad.id,
    perfilId: idPerfil.get("salinas-gasfiteria-24h")!,
    monto: 45000,
    plazoDias: 1,
    mensaje: "Atención de urgencia dentro de 2 horas. Garantía por escrito de 6 meses.",
  });

  const tomates = await publicarNecesidad({
    solicitantePerfilId: idPerfil.get("banqueteria-tres-fuegos")!,
    titulo: "Busco 200 cajas de tomates para septiembre",
    descripcion:
      "Necesito 200 cajas de tomate de 15 kg para eventos de septiembre, con entregas parciales semanales en Providencia.",
    urgencia: "mes",
  });
  await enviarPropuesta({
    necesidadId: tomates.necesidad.id,
    perfilId: idPerfil.get("verduras-del-valle")!,
    monto: 11200,
    plazoDias: 7,
    mensaje: "Precio por caja con entregas semanales de 50 cajas. Producción propia.",
  });

  // 7.3 · Abiertas, sin propuestas todavía: sirven para probar el recorrido completo.
  await publicarNecesidad({
    solicitantePerfilId: idPerfil.get("alvaro-medina")!,
    titulo: "Pintar departamento de 60 m² antes de fin de mes",
    descripcion:
      "Dos dormitorios, living y pasillo. Muros en buen estado, solo requiere lijado menor y dos manos de látex. Providencia.",
    urgencia: "mes",
  });

  await publicarNecesidad({
    solicitantePerfilId: idPerfil.get("ferreteria-el-roble")!,
    titulo: "Necesito flete fijo para reparto de los martes",
    descripcion:
      "Reparto de pedidos de ferretería dentro de Ñuñoa y Macul, todos los martes por la mañana. Volumen de 15 a 25 entregas.",
    urgencia: "semana",
  });

  await publicarNecesidad({
    solicitantePerfilId: idPerfil.get("veterinaria-patas")!,
    titulo: "Diseño de logo y manejo de redes para la clínica",
    descripcion:
      "Queremos renovar la imagen de la veterinaria y ordenar Instagram. Presupuesto acotado, buscamos alguien del barrio.",
    urgencia: "flexible",
  });

  await publicarNecesidad({
    solicitantePerfilId: idPerfil.get("constructora-vecina")!,
    titulo: "Cotizo cemento y arena para obra en Macul",
    descripcion:
      "Necesito 60 sacos de cemento y 4 m³ de arena, con despacho a pie de obra en Macul dentro de la próxima semana.",
    urgencia: "semana",
  });

  paso("necesidades: 8 publicadas, con matching, propuestas y un ciclo completo calificado");

  console.log("\nListo. Puedes ingresar con cualquiera de estas cuentas:");
  console.log(`  rodrigo-fuentes@conecta.demo        · ${CLAVE_DEMO}   (persona que necesita)`);
  console.log(`  servitec-linea-blanca@conecta.demo  · ${CLAVE_DEMO}   (prestador con oportunidades)`);
  console.log(`  panaderia-dona-rosa@conecta.demo    · ${CLAVE_DEMO}   (negocio que compra y vende)`);
  console.log(`  distribuidora-el-molino@conecta.demo· ${CLAVE_DEMO}   (proveedor)`);

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

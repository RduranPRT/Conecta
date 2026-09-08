import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export * from "./auth-schema";

/* ────────────────────────────────────────────────────────────────────────────
 * Enumeraciones del dominio
 * Una sola fuente de verdad: la base define los estados y la aplicación los lee.
 * ──────────────────────────────────────────────────────────────────────────── */

export const rolActorEnum = pgEnum("rol_actor", [
  "persona",
  "prestador",
  "negocio",
  "proveedor",
  "productor",
]);

export const tipoCategoriaEnum = pgEnum("tipo_categoria", ["servicio", "producto", "ambos"]);

export const tipoPublicacionEnum = pgEnum("tipo_publicacion", [
  "producto",
  "servicio",
  "oferta",
  "necesidad",
  "novedad",
  "oportunidad",
]);

export const estadoPublicacionEnum = pgEnum("estado_publicacion", [
  "publicada",
  "pausada",
  "eliminada",
]);

export const urgenciaEnum = pgEnum("urgencia", ["hoy", "semana", "mes", "flexible"]);

export const estadoNecesidadEnum = pgEnum("estado_necesidad", [
  "publicada",
  "en_cotizacion",
  "adjudicada",
  "en_ejecucion",
  "completada",
  "cancelada",
]);

export const estadoPropuestaEnum = pgEnum("estado_propuesta", [
  "enviada",
  "retirada",
  "adjudicada",
  "descartada",
]);

export const origenInvitacionEnum = pgEnum("origen_invitacion", ["ia", "manual", "postulacion"]);

export const estadoInvitacionEnum = pgEnum("estado_invitacion", [
  "enviada",
  "vista",
  "respondida",
  "descartada",
]);

export const estadoOperacionEnum = pgEnum("estado_operacion", [
  "acordada",
  "en_ejecucion",
  "entregada",
  "cerrada",
  "en_disputa",
  "cancelada",
]);

export const tipoVerificacionEnum = pgEnum("tipo_verificacion", [
  "identidad",
  "negocio",
  "prestador",
  "informacion_comercial",
]);

export const estadoVerificacionEnum = pgEnum("estado_verificacion", [
  "pendiente",
  "verificado",
  "rechazado",
]);

export const ambitoAgenteEnum = pgEnum("ambito_agente", ["usuario", "administracion"]);

export const planEnum = pgEnum("plan", ["gratis", "profesional", "empresa"]);

/* ────────────────────────────────────────────────────────────────────────────
 * Territorio · País → Región → Comuna
 * El territorio es contexto, no una instancia distinta de la plataforma.
 * ──────────────────────────────────────────────────────────────────────────── */

export const paises = pgTable("paises", {
  id: serial("id").primaryKey(),
  codigo: text("codigo").notNull().unique(), // ISO 3166-1 alfa-2
  nombre: text("nombre").notNull(),
  moneda: text("moneda").notNull().default("CLP"),
  prefijoTelefono: text("prefijo_telefono"),
  activo: boolean("activo").notNull().default(true),
});

export const regiones = pgTable(
  "regiones",
  {
    id: serial("id").primaryKey(),
    paisId: integer("pais_id")
      .notNull()
      .references(() => paises.id, { onDelete: "cascade" }),
    codigo: text("codigo").notNull(),
    nombre: text("nombre").notNull(),
    orden: integer("orden").notNull().default(0),
  },
  (t) => [uniqueIndex("regiones_pais_codigo_uq").on(t.paisId, t.codigo)],
);

export const comunas = pgTable(
  "comunas",
  {
    id: serial("id").primaryKey(),
    regionId: integer("region_id")
      .notNull()
      .references(() => regiones.id, { onDelete: "cascade" }),
    codigo: text("codigo").notNull(),
    nombre: text("nombre").notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    /** Comuna piloto: la plataforma arranca aquí, pero el modelo no lo asume. */
    activa: boolean("activa").notNull().default(false),
  },
  (t) => [
    uniqueIndex("comunas_region_codigo_uq").on(t.regionId, t.codigo),
    index("comunas_nombre_idx").on(t.nombre),
  ],
);

/* ────────────────────────────────────────────────────────────────────────────
 * Taxonomía de categorías (jerárquica y común a servicios y productos)
 * ──────────────────────────────────────────────────────────────────────────── */

export const categorias = pgTable(
  "categorias",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    nombre: text("nombre").notNull(),
    tipo: tipoCategoriaEnum("tipo").notNull().default("ambos"),
    padreId: integer("padre_id"),
    icono: text("icono"),
    /** Palabras que el intérprete de búsqueda asocia a esta categoría. */
    sinonimos: jsonb("sinonimos").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    orden: integer("orden").notNull().default(0),
  },
  (t) => [index("categorias_padre_idx").on(t.padreId)],
);

/* ────────────────────────────────────────────────────────────────────────────
 * Identidad · 1 identidad → múltiples roles → múltiples capacidades
 * ──────────────────────────────────────────────────────────────────────────── */

export const perfiles = pgTable(
  "perfiles",
  {
    id: serial("id").primaryKey(),
    usuarioId: text("usuario_id")
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    slug: text("slug").notNull().unique(),
    nombre: text("nombre").notNull(),
    descripcion: text("descripcion"),
    avatarUrl: text("avatar_url"),
    /** Identificador tributario local (RUT en Chile). El campo no asume país. */
    identificadorFiscal: text("identificador_fiscal"),
    telefono: text("telefono"),
    correoPublico: text("correo_publico"),
    sitioWeb: text("sitio_web"),
    redes: jsonb("redes").$type<Record<string, string>>().notNull().default(sql`'{}'::jsonb`),

    // Ubicación física ≠ territorio administrativo ≠ cobertura ≠ radio.
    comunaId: integer("comuna_id").references(() => comunas.id),
    direccion: text("direccion"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    /** Radio de atención a domicilio, en kilómetros. NULL = solo local. */
    radioKm: integer("radio_km"),

    disponibleAhora: boolean("disponible_ahora").notNull().default(false),
    disponibleHasta: timestamp("disponible_hasta", { withTimezone: true }),
    horarios: jsonb("horarios")
      .$type<Record<string, { desde: string; hasta: string } | null>>()
      .notNull()
      .default(sql`'{}'::jsonb`),

    plan: planEnum("plan").notNull().default("gratis"),
    reputacionPromedio: numeric("reputacion_promedio", { precision: 3, scale: 2 }),
    reputacionConteo: integer("reputacion_conteo").notNull().default(0),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("perfiles_comuna_idx").on(t.comunaId),
    index("perfiles_disponible_idx").on(t.disponibleAhora),
    index("perfiles_nombre_idx").on(t.nombre),
  ],
);

export const perfilRoles = pgTable(
  "perfil_roles",
  {
    id: serial("id").primaryKey(),
    perfilId: integer("perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    rol: rolActorEnum("rol").notNull(),
    activo: boolean("activo").notNull().default(true),
    /** Datos propios del rol: razón social, giro, capacidad, oficio, etc. */
    datos: jsonb("datos").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("perfil_roles_uq").on(t.perfilId, t.rol)],
);

export const perfilCategorias = pgTable(
  "perfil_categorias",
  {
    perfilId: integer("perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    categoriaId: integer("categoria_id")
      .notNull()
      .references(() => categorias.id, { onDelete: "cascade" }),
    principal: boolean("principal").notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.perfilId, t.categoriaId] })],
);

/** Zona de cobertura: comunas donde opera, distintas de la ubicación física. */
export const coberturas = pgTable(
  "coberturas",
  {
    perfilId: integer("perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    comunaId: integer("comuna_id")
      .notNull()
      .references(() => comunas.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.perfilId, t.comunaId] })],
);

export const verificaciones = pgTable(
  "verificaciones",
  {
    id: serial("id").primaryKey(),
    perfilId: integer("perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    tipo: tipoVerificacionEnum("tipo").notNull(),
    estado: estadoVerificacionEnum("estado").notNull().default("pendiente"),
    evidencia: text("evidencia"),
    nota: text("nota"),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
    resueltoEn: timestamp("resuelto_en", { withTimezone: true }),
  },
  (t) => [uniqueIndex("verificaciones_uq").on(t.perfilId, t.tipo)],
);

/* ────────────────────────────────────────────────────────────────────────────
 * Catálogo · productos y servicios ofrecidos
 * ──────────────────────────────────────────────────────────────────────────── */

export const items = pgTable(
  "items",
  {
    id: serial("id").primaryKey(),
    perfilId: integer("perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    tipo: tipoCategoriaEnum("tipo").notNull().default("servicio"),
    nombre: text("nombre").notNull(),
    descripcion: text("descripcion"),
    categoriaId: integer("categoria_id").references(() => categorias.id),
    precio: numeric("precio", { precision: 12, scale: 2 }),
    moneda: text("moneda").notNull().default("CLP"),
    unidad: text("unidad"),
    imagenUrl: text("imagen_url"),
    activo: boolean("activo").notNull().default(true),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("items_perfil_idx").on(t.perfilId), index("items_categoria_idx").on(t.categoriaId)],
);

/* ────────────────────────────────────────────────────────────────────────────
 * Necesidades · Descubrimiento → Interacción → Oportunidad → Operación
 * ──────────────────────────────────────────────────────────────────────────── */

export const necesidades = pgTable(
  "necesidades",
  {
    id: serial("id").primaryKey(),
    solicitantePerfilId: integer("solicitante_perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    titulo: text("titulo").notNull(),
    descripcion: text("descripcion").notNull(),
    categoriaId: integer("categoria_id").references(() => categorias.id),
    comunaId: integer("comuna_id").references(() => comunas.id),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    presupuestoMin: numeric("presupuesto_min", { precision: 12, scale: 2 }),
    presupuestoMax: numeric("presupuesto_max", { precision: 12, scale: 2 }),
    moneda: text("moneda").notNull().default("CLP"),
    urgencia: urgenciaEnum("urgencia").notNull().default("flexible"),
    fechaRequerida: date("fecha_requerida"),
    estado: estadoNecesidadEnum("estado").notNull().default("publicada"),
    propuestaAdjudicadaId: integer("propuesta_adjudicada_id"),
    /** Lo que el intérprete entendió al publicarla; queda para auditar la IA. */
    interpretacion: jsonb("interpretacion").$type<Record<string, unknown>>(),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
    cerradaEn: timestamp("cerrada_en", { withTimezone: true }),
  },
  (t) => [
    index("necesidades_estado_idx").on(t.estado),
    index("necesidades_comuna_idx").on(t.comunaId),
    index("necesidades_categoria_idx").on(t.categoriaId),
  ],
);

export const invitaciones = pgTable(
  "invitaciones",
  {
    id: serial("id").primaryKey(),
    necesidadId: integer("necesidad_id")
      .notNull()
      .references(() => necesidades.id, { onDelete: "cascade" }),
    perfilId: integer("perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    origen: origenInvitacionEnum("origen").notNull().default("manual"),
    estado: estadoInvitacionEnum("estado").notNull().default("enviada"),
    distanciaKm: numeric("distancia_km", { precision: 8, scale: 2 }),
    puntaje: numeric("puntaje", { precision: 6, scale: 3 }),
    motivo: text("motivo"),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("invitaciones_uq").on(t.necesidadId, t.perfilId),
    index("invitaciones_perfil_idx").on(t.perfilId),
  ],
);

export const propuestas = pgTable(
  "propuestas",
  {
    id: serial("id").primaryKey(),
    necesidadId: integer("necesidad_id")
      .notNull()
      .references(() => necesidades.id, { onDelete: "cascade" }),
    perfilId: integer("perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    monto: numeric("monto", { precision: 12, scale: 2 }).notNull(),
    moneda: text("moneda").notNull().default("CLP"),
    plazoDias: integer("plazo_dias").notNull().default(1),
    mensaje: text("mensaje"),
    adjuntos: jsonb("adjuntos").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    estado: estadoPropuestaEnum("estado").notNull().default("enviada"),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("propuestas_uq").on(t.necesidadId, t.perfilId),
    index("propuestas_perfil_idx").on(t.perfilId),
  ],
);

export const operaciones = pgTable(
  "operaciones",
  {
    id: serial("id").primaryKey(),
    necesidadId: integer("necesidad_id")
      .notNull()
      .references(() => necesidades.id, { onDelete: "cascade" }),
    propuestaId: integer("propuesta_id")
      .notNull()
      .references(() => propuestas.id, { onDelete: "cascade" }),
    compradorPerfilId: integer("comprador_perfil_id")
      .notNull()
      .references(() => perfiles.id),
    proveedorPerfilId: integer("proveedor_perfil_id")
      .notNull()
      .references(() => perfiles.id),
    monto: numeric("monto", { precision: 12, scale: 2 }).notNull(),
    moneda: text("moneda").notNull().default("CLP"),
    estado: estadoOperacionEnum("estado").notNull().default("acordada"),
    /** Fase 2 · el módulo de pagos escribe aquí sin cambiar el resto. */
    pagoEstado: text("pago_estado").notNull().default("fuera_de_plataforma"),
    acordadaEn: timestamp("acordada_en", { withTimezone: true }).notNull().defaultNow(),
    completadaEn: timestamp("completada_en", { withTimezone: true }),
  },
  (t) => [
    index("operaciones_comprador_idx").on(t.compradorPerfilId),
    index("operaciones_proveedor_idx").on(t.proveedorPerfilId),
  ],
);

export const calificaciones = pgTable(
  "calificaciones",
  {
    id: serial("id").primaryKey(),
    operacionId: integer("operacion_id")
      .notNull()
      .references(() => operaciones.id, { onDelete: "cascade" }),
    autorPerfilId: integer("autor_perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    destinoPerfilId: integer("destino_perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    puntaje: integer("puntaje").notNull(),
    comentario: text("comentario"),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("calificaciones_uq").on(t.operacionId, t.autorPerfilId),
    index("calificaciones_destino_idx").on(t.destinoPerfilId),
  ],
);

/* ────────────────────────────────────────────────────────────────────────────
 * Feed · el contenido se convierte en acción
 * ──────────────────────────────────────────────────────────────────────────── */

export const publicaciones = pgTable(
  "publicaciones",
  {
    id: serial("id").primaryKey(),
    autorPerfilId: integer("autor_perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    tipo: tipoPublicacionEnum("tipo").notNull().default("novedad"),
    titulo: text("titulo").notNull(),
    cuerpo: text("cuerpo"),
    categoriaId: integer("categoria_id").references(() => categorias.id),
    comunaId: integer("comuna_id").references(() => comunas.id),
    precio: numeric("precio", { precision: 12, scale: 2 }),
    moneda: text("moneda").notNull().default("CLP"),
    imagenUrl: text("imagen_url"),
    /** Enlace a la necesidad cuando la publicación es una solicitud. */
    necesidadId: integer("necesidad_id").references(() => necesidades.id, { onDelete: "cascade" }),
    itemId: integer("item_id").references(() => items.id, { onDelete: "set null" }),
    patrocinado: boolean("patrocinado").notNull().default(false),
    patrocinioHasta: timestamp("patrocinio_hasta", { withTimezone: true }),
    /** Radio en km de la promoción territorial. */
    patrocinioRadioKm: integer("patrocinio_radio_km"),
    estado: estadoPublicacionEnum("estado").notNull().default("publicada"),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("publicaciones_comuna_idx").on(t.comunaId),
    index("publicaciones_tipo_idx").on(t.tipo),
    index("publicaciones_creado_idx").on(t.creadoEn),
  ],
);

export const reacciones = pgTable(
  "reacciones",
  {
    publicacionId: integer("publicacion_id")
      .notNull()
      .references(() => publicaciones.id, { onDelete: "cascade" }),
    perfilId: integer("perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.publicacionId, t.perfilId] })],
);

/**
 * Guardados: marcador simple de "quiero volver a esto", pedido por Álvaro en
 * la propuesta de simplificación de navegación (sep-2026) como parte del hub
 * "Mi Conecta". Mismo patrón que `reacciones`: clave compuesta, sin tabla de
 * eventos propia más allá del registro en `eventos`.
 */
export const guardados = pgTable(
  "guardados",
  {
    publicacionId: integer("publicacion_id")
      .notNull()
      .references(() => publicaciones.id, { onDelete: "cascade" }),
    perfilId: integer("perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.publicacionId, t.perfilId] })],
);

export const seguimientos = pgTable(
  "seguimientos",
  {
    seguidorPerfilId: integer("seguidor_perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    seguidoPerfilId: integer("seguido_perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.seguidorPerfilId, t.seguidoPerfilId] })],
);

/* ────────────────────────────────────────────────────────────────────────────
 * Mensajería
 * ──────────────────────────────────────────────────────────────────────────── */

export const conversaciones = pgTable("conversaciones", {
  id: serial("id").primaryKey(),
  asunto: text("asunto"),
  necesidadId: integer("necesidad_id").references(() => necesidades.id, { onDelete: "set null" }),
  publicacionId: integer("publicacion_id").references(() => publicaciones.id, {
    onDelete: "set null",
  }),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true }).notNull().defaultNow(),
});

export const conversacionParticipantes = pgTable(
  "conversacion_participantes",
  {
    conversacionId: integer("conversacion_id")
      .notNull()
      .references(() => conversaciones.id, { onDelete: "cascade" }),
    perfilId: integer("perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.conversacionId, t.perfilId] })],
);

export const mensajes = pgTable(
  "mensajes",
  {
    id: serial("id").primaryKey(),
    conversacionId: integer("conversacion_id")
      .notNull()
      .references(() => conversaciones.id, { onDelete: "cascade" }),
    autorPerfilId: integer("autor_perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    cuerpo: text("cuerpo").notNull(),
    leidoEn: timestamp("leido_en", { withTimezone: true }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("mensajes_conversacion_idx").on(t.conversacionId)],
);

/* ────────────────────────────────────────────────────────────────────────────
 * Inteligencia artificial · catálogo declarado, ejecución en Fase 2
 * ──────────────────────────────────────────────────────────────────────────── */

export const agentes = pgTable("agentes", {
  codigo: text("codigo").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion").notNull(),
  ambito: ambitoAgenteEnum("ambito").notNull().default("usuario"),
  planMinimo: planEnum("plan_minimo").notNull().default("profesional"),
  disponible: boolean("disponible").notNull().default(false),
  orden: integer("orden").notNull().default(0),
});

export const agentesContratados = pgTable(
  "agentes_contratados",
  {
    id: serial("id").primaryKey(),
    perfilId: integer("perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    agenteCodigo: text("agente_codigo")
      .notNull()
      .references(() => agentes.codigo, { onDelete: "cascade" }),
    /** 1 recomienda · 2 prepara y pide aprobación · 3 ejecuta lo autorizado. */
    nivelAutonomia: integer("nivel_autonomia").notNull().default(1),
    activo: boolean("activo").notNull().default(true),
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("agentes_contratados_uq").on(t.perfilId, t.agenteCodigo)],
);

/** Acciones que un agente propone y que esperan autorización humana. */
export const accionesAgente = pgTable(
  "acciones_agente",
  {
    id: serial("id").primaryKey(),
    perfilId: integer("perfil_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    agenteCodigo: text("agente_codigo").notNull(),
    resumen: text("resumen").notNull(),
    caso: text("caso").notNull(),
    argumentos: jsonb("argumentos").$type<Record<string, unknown>>().notNull(),
    estado: text("estado").notNull().default("propuesta"),
    requiereAutorizacion: boolean("requiere_autorizacion").notNull().default(true),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
    resueltoEn: timestamp("resuelto_en", { withTimezone: true }),
  },
  (t) => [index("acciones_agente_perfil_idx").on(t.perfilId)],
);

/* ────────────────────────────────────────────────────────────────────────────
 * Trazabilidad y señales
 * ──────────────────────────────────────────────────────────────────────────── */

export const eventos = pgTable(
  "eventos",
  {
    id: serial("id").primaryKey(),
    tipo: text("tipo").notNull(),
    actorPerfilId: integer("actor_perfil_id").references(() => perfiles.id, {
      onDelete: "set null",
    }),
    entidad: text("entidad").notNull(),
    entidadId: integer("entidad_id"),
    datos: jsonb("datos").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("eventos_entidad_idx").on(t.entidad, t.entidadId)],
);

export const busquedas = pgTable("busquedas", {
  id: serial("id").primaryKey(),
  perfilId: integer("perfil_id").references(() => perfiles.id, { onDelete: "set null" }),
  consulta: text("consulta").notNull(),
  interpretacion: jsonb("interpretacion").$type<Record<string, unknown>>(),
  resultados: integer("resultados").notNull().default(0),
  motor: text("motor").notNull().default("reglas"),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

/* ────────────────────────────────────────────────────────────────────────────
 * Relaciones (para consultas con `db.query`)
 * ──────────────────────────────────────────────────────────────────────────── */

export const perfilesRelaciones = relations(perfiles, ({ one, many }) => ({
  comuna: one(comunas, { fields: [perfiles.comunaId], references: [comunas.id] }),
  roles: many(perfilRoles),
  categorias: many(perfilCategorias),
  coberturas: many(coberturas),
  verificaciones: many(verificaciones),
  items: many(items),
  publicaciones: many(publicaciones),
}));

export const comunasRelaciones = relations(comunas, ({ one }) => ({
  region: one(regiones, { fields: [comunas.regionId], references: [regiones.id] }),
}));

export const regionesRelaciones = relations(regiones, ({ one }) => ({
  pais: one(paises, { fields: [regiones.paisId], references: [paises.id] }),
}));

export const perfilRolesRelaciones = relations(perfilRoles, ({ one }) => ({
  perfil: one(perfiles, { fields: [perfilRoles.perfilId], references: [perfiles.id] }),
}));

export const perfilCategoriasRelaciones = relations(perfilCategorias, ({ one }) => ({
  perfil: one(perfiles, { fields: [perfilCategorias.perfilId], references: [perfiles.id] }),
  categoria: one(categorias, {
    fields: [perfilCategorias.categoriaId],
    references: [categorias.id],
  }),
}));

export const coberturasRelaciones = relations(coberturas, ({ one }) => ({
  perfil: one(perfiles, { fields: [coberturas.perfilId], references: [perfiles.id] }),
  comuna: one(comunas, { fields: [coberturas.comunaId], references: [comunas.id] }),
}));

export const necesidadesRelaciones = relations(necesidades, ({ one, many }) => ({
  solicitante: one(perfiles, {
    fields: [necesidades.solicitantePerfilId],
    references: [perfiles.id],
  }),
  categoria: one(categorias, { fields: [necesidades.categoriaId], references: [categorias.id] }),
  comuna: one(comunas, { fields: [necesidades.comunaId], references: [comunas.id] }),
  propuestas: many(propuestas),
  invitaciones: many(invitaciones),
}));

export const propuestasRelaciones = relations(propuestas, ({ one }) => ({
  necesidad: one(necesidades, { fields: [propuestas.necesidadId], references: [necesidades.id] }),
  perfil: one(perfiles, { fields: [propuestas.perfilId], references: [perfiles.id] }),
}));

export const invitacionesRelaciones = relations(invitaciones, ({ one }) => ({
  necesidad: one(necesidades, { fields: [invitaciones.necesidadId], references: [necesidades.id] }),
  perfil: one(perfiles, { fields: [invitaciones.perfilId], references: [perfiles.id] }),
}));

export const publicacionesRelaciones = relations(publicaciones, ({ one }) => ({
  autor: one(perfiles, { fields: [publicaciones.autorPerfilId], references: [perfiles.id] }),
  categoria: one(categorias, { fields: [publicaciones.categoriaId], references: [categorias.id] }),
  comuna: one(comunas, { fields: [publicaciones.comunaId], references: [comunas.id] }),
  necesidad: one(necesidades, {
    fields: [publicaciones.necesidadId],
    references: [necesidades.id],
  }),
}));

export const operacionesRelaciones = relations(operaciones, ({ one, many }) => ({
  necesidad: one(necesidades, { fields: [operaciones.necesidadId], references: [necesidades.id] }),
  propuesta: one(propuestas, { fields: [operaciones.propuestaId], references: [propuestas.id] }),
  comprador: one(perfiles, {
    fields: [operaciones.compradorPerfilId],
    references: [perfiles.id],
    relationName: "comprador",
  }),
  proveedor: one(perfiles, {
    fields: [operaciones.proveedorPerfilId],
    references: [perfiles.id],
    relationName: "proveedor",
  }),
  calificaciones: many(calificaciones),
}));

export const mensajesRelaciones = relations(mensajes, ({ one }) => ({
  conversacion: one(conversaciones, {
    fields: [mensajes.conversacionId],
    references: [conversaciones.id],
  }),
  autor: one(perfiles, { fields: [mensajes.autorPerfilId], references: [perfiles.id] }),
}));

export const conversacionesRelaciones = relations(conversaciones, ({ many }) => ({
  participantes: many(conversacionParticipantes),
  mensajes: many(mensajes),
}));

export const conversacionParticipantesRelaciones = relations(
  conversacionParticipantes,
  ({ one }) => ({
    conversacion: one(conversaciones, {
      fields: [conversacionParticipantes.conversacionId],
      references: [conversaciones.id],
    }),
    perfil: one(perfiles, {
      fields: [conversacionParticipantes.perfilId],
      references: [perfiles.id],
    }),
  }),
);

/* Tipos derivados, usados por la capa de casos de uso. */
export type Perfil = typeof perfiles.$inferSelect;
export type Necesidad = typeof necesidades.$inferSelect;
export type Propuesta = typeof propuestas.$inferSelect;
export type Publicacion = typeof publicaciones.$inferSelect;
export type Operacion = typeof operaciones.$inferSelect;
export type Comuna = typeof comunas.$inferSelect;
export type Categoria = typeof categorias.$inferSelect;
export type RolActor = (typeof rolActorEnum.enumValues)[number];

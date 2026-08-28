CREATE TYPE "public"."ambito_agente" AS ENUM('usuario', 'administracion');--> statement-breakpoint
CREATE TYPE "public"."estado_invitacion" AS ENUM('enviada', 'vista', 'respondida', 'descartada');--> statement-breakpoint
CREATE TYPE "public"."estado_necesidad" AS ENUM('publicada', 'en_cotizacion', 'adjudicada', 'en_ejecucion', 'completada', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."estado_operacion" AS ENUM('acordada', 'en_ejecucion', 'entregada', 'cerrada', 'en_disputa', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."estado_propuesta" AS ENUM('enviada', 'retirada', 'adjudicada', 'descartada');--> statement-breakpoint
CREATE TYPE "public"."estado_publicacion" AS ENUM('publicada', 'pausada', 'eliminada');--> statement-breakpoint
CREATE TYPE "public"."estado_verificacion" AS ENUM('pendiente', 'verificado', 'rechazado');--> statement-breakpoint
CREATE TYPE "public"."origen_invitacion" AS ENUM('ia', 'manual', 'postulacion');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('gratis', 'profesional', 'empresa');--> statement-breakpoint
CREATE TYPE "public"."rol_actor" AS ENUM('persona', 'prestador', 'negocio', 'proveedor', 'productor');--> statement-breakpoint
CREATE TYPE "public"."tipo_categoria" AS ENUM('servicio', 'producto', 'ambos');--> statement-breakpoint
CREATE TYPE "public"."tipo_publicacion" AS ENUM('producto', 'servicio', 'oferta', 'necesidad', 'novedad', 'oportunidad');--> statement-breakpoint
CREATE TYPE "public"."tipo_verificacion" AS ENUM('identidad', 'negocio', 'prestador', 'informacion_comercial');--> statement-breakpoint
CREATE TYPE "public"."urgencia" AS ENUM('hoy', 'semana', 'mes', 'flexible');--> statement-breakpoint
CREATE TABLE "acciones_agente" (
	"id" serial PRIMARY KEY NOT NULL,
	"perfil_id" integer NOT NULL,
	"agente_codigo" text NOT NULL,
	"resumen" text NOT NULL,
	"caso" text NOT NULL,
	"argumentos" jsonb NOT NULL,
	"estado" text DEFAULT 'propuesta' NOT NULL,
	"requiere_autorizacion" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"resuelto_en" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "agentes" (
	"codigo" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text NOT NULL,
	"ambito" "ambito_agente" DEFAULT 'usuario' NOT NULL,
	"plan_minimo" "plan" DEFAULT 'profesional' NOT NULL,
	"disponible" boolean DEFAULT false NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agentes_contratados" (
	"id" serial PRIMARY KEY NOT NULL,
	"perfil_id" integer NOT NULL,
	"agente_codigo" text NOT NULL,
	"nivel_autonomia" integer DEFAULT 1 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "busquedas" (
	"id" serial PRIMARY KEY NOT NULL,
	"perfil_id" integer,
	"consulta" text NOT NULL,
	"interpretacion" jsonb,
	"resultados" integer DEFAULT 0 NOT NULL,
	"motor" text DEFAULT 'reglas' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calificaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"operacion_id" integer NOT NULL,
	"autor_perfil_id" integer NOT NULL,
	"destino_perfil_id" integer NOT NULL,
	"puntaje" integer NOT NULL,
	"comentario" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"nombre" text NOT NULL,
	"tipo" "tipo_categoria" DEFAULT 'ambos' NOT NULL,
	"padre_id" integer,
	"icono" text,
	"sinonimos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categorias_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "coberturas" (
	"perfil_id" integer NOT NULL,
	"comuna_id" integer NOT NULL,
	CONSTRAINT "coberturas_perfil_id_comuna_id_pk" PRIMARY KEY("perfil_id","comuna_id")
);
--> statement-breakpoint
CREATE TABLE "comunas" (
	"id" serial PRIMARY KEY NOT NULL,
	"region_id" integer NOT NULL,
	"codigo" text NOT NULL,
	"nombre" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"activa" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversacion_participantes" (
	"conversacion_id" integer NOT NULL,
	"perfil_id" integer NOT NULL,
	CONSTRAINT "conversacion_participantes_conversacion_id_perfil_id_pk" PRIMARY KEY("conversacion_id","perfil_id")
);
--> statement-breakpoint
CREATE TABLE "conversaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"asunto" text,
	"necesidad_id" integer,
	"publicacion_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eventos" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo" text NOT NULL,
	"actor_perfil_id" integer,
	"entidad" text NOT NULL,
	"entidad_id" integer,
	"datos" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"necesidad_id" integer NOT NULL,
	"perfil_id" integer NOT NULL,
	"origen" "origen_invitacion" DEFAULT 'manual' NOT NULL,
	"estado" "estado_invitacion" DEFAULT 'enviada' NOT NULL,
	"distancia_km" numeric(8, 2),
	"puntaje" numeric(6, 3),
	"motivo" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"perfil_id" integer NOT NULL,
	"tipo" "tipo_categoria" DEFAULT 'servicio' NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"categoria_id" integer,
	"precio" numeric(12, 2),
	"moneda" text DEFAULT 'CLP' NOT NULL,
	"unidad" text,
	"imagen_url" text,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mensajes" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversacion_id" integer NOT NULL,
	"autor_perfil_id" integer NOT NULL,
	"cuerpo" text NOT NULL,
	"leido_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "necesidades" (
	"id" serial PRIMARY KEY NOT NULL,
	"solicitante_perfil_id" integer NOT NULL,
	"titulo" text NOT NULL,
	"descripcion" text NOT NULL,
	"categoria_id" integer,
	"comuna_id" integer,
	"lat" double precision,
	"lng" double precision,
	"presupuesto_min" numeric(12, 2),
	"presupuesto_max" numeric(12, 2),
	"moneda" text DEFAULT 'CLP' NOT NULL,
	"urgencia" "urgencia" DEFAULT 'flexible' NOT NULL,
	"fecha_requerida" date,
	"estado" "estado_necesidad" DEFAULT 'publicada' NOT NULL,
	"propuesta_adjudicada_id" integer,
	"interpretacion" jsonb,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"cerrada_en" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "operaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"necesidad_id" integer NOT NULL,
	"propuesta_id" integer NOT NULL,
	"comprador_perfil_id" integer NOT NULL,
	"proveedor_perfil_id" integer NOT NULL,
	"monto" numeric(12, 2) NOT NULL,
	"moneda" text DEFAULT 'CLP' NOT NULL,
	"estado" "estado_operacion" DEFAULT 'acordada' NOT NULL,
	"pago_estado" text DEFAULT 'fuera_de_plataforma' NOT NULL,
	"acordada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"completada_en" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "paises" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"nombre" text NOT NULL,
	"moneda" text DEFAULT 'CLP' NOT NULL,
	"prefijo_telefono" text,
	"activo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "paises_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "perfil_categorias" (
	"perfil_id" integer NOT NULL,
	"categoria_id" integer NOT NULL,
	"principal" boolean DEFAULT false NOT NULL,
	CONSTRAINT "perfil_categorias_perfil_id_categoria_id_pk" PRIMARY KEY("perfil_id","categoria_id")
);
--> statement-breakpoint
CREATE TABLE "perfil_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"perfil_id" integer NOT NULL,
	"rol" "rol_actor" NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"datos" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "perfiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" text,
	"slug" text NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"avatar_url" text,
	"identificador_fiscal" text,
	"telefono" text,
	"correo_publico" text,
	"sitio_web" text,
	"redes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"comuna_id" integer,
	"direccion" text,
	"lat" double precision,
	"lng" double precision,
	"radio_km" integer,
	"disponible_ahora" boolean DEFAULT false NOT NULL,
	"disponible_hasta" timestamp with time zone,
	"horarios" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"plan" "plan" DEFAULT 'gratis' NOT NULL,
	"reputacion_promedio" numeric(3, 2),
	"reputacion_conteo" integer DEFAULT 0 NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "perfiles_usuario_id_unique" UNIQUE("usuario_id"),
	CONSTRAINT "perfiles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "propuestas" (
	"id" serial PRIMARY KEY NOT NULL,
	"necesidad_id" integer NOT NULL,
	"perfil_id" integer NOT NULL,
	"monto" numeric(12, 2) NOT NULL,
	"moneda" text DEFAULT 'CLP' NOT NULL,
	"plazo_dias" integer DEFAULT 1 NOT NULL,
	"mensaje" text,
	"adjuntos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"estado" "estado_propuesta" DEFAULT 'enviada' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publicaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"autor_perfil_id" integer NOT NULL,
	"tipo" "tipo_publicacion" DEFAULT 'novedad' NOT NULL,
	"titulo" text NOT NULL,
	"cuerpo" text,
	"categoria_id" integer,
	"comuna_id" integer,
	"precio" numeric(12, 2),
	"moneda" text DEFAULT 'CLP' NOT NULL,
	"imagen_url" text,
	"necesidad_id" integer,
	"item_id" integer,
	"patrocinado" boolean DEFAULT false NOT NULL,
	"patrocinio_hasta" timestamp with time zone,
	"patrocinio_radio_km" integer,
	"estado" "estado_publicacion" DEFAULT 'publicada' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reacciones" (
	"publicacion_id" integer NOT NULL,
	"perfil_id" integer NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reacciones_publicacion_id_perfil_id_pk" PRIMARY KEY("publicacion_id","perfil_id")
);
--> statement-breakpoint
CREATE TABLE "regiones" (
	"id" serial PRIMARY KEY NOT NULL,
	"pais_id" integer NOT NULL,
	"codigo" text NOT NULL,
	"nombre" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seguimientos" (
	"seguidor_perfil_id" integer NOT NULL,
	"seguido_perfil_id" integer NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seguimientos_seguidor_perfil_id_seguido_perfil_id_pk" PRIMARY KEY("seguidor_perfil_id","seguido_perfil_id")
);
--> statement-breakpoint
CREATE TABLE "verificaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"perfil_id" integer NOT NULL,
	"tipo" "tipo_verificacion" NOT NULL,
	"estado" "estado_verificacion" DEFAULT 'pendiente' NOT NULL,
	"evidencia" text,
	"nota" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"resuelto_en" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"issuer" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "acciones_agente" ADD CONSTRAINT "acciones_agente_perfil_id_perfiles_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentes_contratados" ADD CONSTRAINT "agentes_contratados_perfil_id_perfiles_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentes_contratados" ADD CONSTRAINT "agentes_contratados_agente_codigo_agentes_codigo_fk" FOREIGN KEY ("agente_codigo") REFERENCES "public"."agentes"("codigo") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "busquedas" ADD CONSTRAINT "busquedas_perfil_id_perfiles_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_operacion_id_operaciones_id_fk" FOREIGN KEY ("operacion_id") REFERENCES "public"."operaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_autor_perfil_id_perfiles_id_fk" FOREIGN KEY ("autor_perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_destino_perfil_id_perfiles_id_fk" FOREIGN KEY ("destino_perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coberturas" ADD CONSTRAINT "coberturas_perfil_id_perfiles_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coberturas" ADD CONSTRAINT "coberturas_comuna_id_comunas_id_fk" FOREIGN KEY ("comuna_id") REFERENCES "public"."comunas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comunas" ADD CONSTRAINT "comunas_region_id_regiones_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regiones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversacion_participantes" ADD CONSTRAINT "conversacion_participantes_conversacion_id_conversaciones_id_fk" FOREIGN KEY ("conversacion_id") REFERENCES "public"."conversaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversacion_participantes" ADD CONSTRAINT "conversacion_participantes_perfil_id_perfiles_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_necesidad_id_necesidades_id_fk" FOREIGN KEY ("necesidad_id") REFERENCES "public"."necesidades"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_publicacion_id_publicaciones_id_fk" FOREIGN KEY ("publicacion_id") REFERENCES "public"."publicaciones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_actor_perfil_id_perfiles_id_fk" FOREIGN KEY ("actor_perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitaciones" ADD CONSTRAINT "invitaciones_necesidad_id_necesidades_id_fk" FOREIGN KEY ("necesidad_id") REFERENCES "public"."necesidades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitaciones" ADD CONSTRAINT "invitaciones_perfil_id_perfiles_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_perfil_id_perfiles_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_conversacion_id_conversaciones_id_fk" FOREIGN KEY ("conversacion_id") REFERENCES "public"."conversaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_autor_perfil_id_perfiles_id_fk" FOREIGN KEY ("autor_perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "necesidades" ADD CONSTRAINT "necesidades_solicitante_perfil_id_perfiles_id_fk" FOREIGN KEY ("solicitante_perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "necesidades" ADD CONSTRAINT "necesidades_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "necesidades" ADD CONSTRAINT "necesidades_comuna_id_comunas_id_fk" FOREIGN KEY ("comuna_id") REFERENCES "public"."comunas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operaciones" ADD CONSTRAINT "operaciones_necesidad_id_necesidades_id_fk" FOREIGN KEY ("necesidad_id") REFERENCES "public"."necesidades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operaciones" ADD CONSTRAINT "operaciones_propuesta_id_propuestas_id_fk" FOREIGN KEY ("propuesta_id") REFERENCES "public"."propuestas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operaciones" ADD CONSTRAINT "operaciones_comprador_perfil_id_perfiles_id_fk" FOREIGN KEY ("comprador_perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operaciones" ADD CONSTRAINT "operaciones_proveedor_perfil_id_perfiles_id_fk" FOREIGN KEY ("proveedor_perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfil_categorias" ADD CONSTRAINT "perfil_categorias_perfil_id_perfiles_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfil_categorias" ADD CONSTRAINT "perfil_categorias_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfil_roles" ADD CONSTRAINT "perfil_roles_perfil_id_perfiles_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfiles" ADD CONSTRAINT "perfiles_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfiles" ADD CONSTRAINT "perfiles_comuna_id_comunas_id_fk" FOREIGN KEY ("comuna_id") REFERENCES "public"."comunas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "propuestas" ADD CONSTRAINT "propuestas_necesidad_id_necesidades_id_fk" FOREIGN KEY ("necesidad_id") REFERENCES "public"."necesidades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "propuestas" ADD CONSTRAINT "propuestas_perfil_id_perfiles_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_autor_perfil_id_perfiles_id_fk" FOREIGN KEY ("autor_perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_comuna_id_comunas_id_fk" FOREIGN KEY ("comuna_id") REFERENCES "public"."comunas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_necesidad_id_necesidades_id_fk" FOREIGN KEY ("necesidad_id") REFERENCES "public"."necesidades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reacciones" ADD CONSTRAINT "reacciones_publicacion_id_publicaciones_id_fk" FOREIGN KEY ("publicacion_id") REFERENCES "public"."publicaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reacciones" ADD CONSTRAINT "reacciones_perfil_id_perfiles_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regiones" ADD CONSTRAINT "regiones_pais_id_paises_id_fk" FOREIGN KEY ("pais_id") REFERENCES "public"."paises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_seguidor_perfil_id_perfiles_id_fk" FOREIGN KEY ("seguidor_perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_seguido_perfil_id_perfiles_id_fk" FOREIGN KEY ("seguido_perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verificaciones" ADD CONSTRAINT "verificaciones_perfil_id_perfiles_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "acciones_agente_perfil_idx" ON "acciones_agente" USING btree ("perfil_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agentes_contratados_uq" ON "agentes_contratados" USING btree ("perfil_id","agente_codigo");--> statement-breakpoint
CREATE UNIQUE INDEX "calificaciones_uq" ON "calificaciones" USING btree ("operacion_id","autor_perfil_id");--> statement-breakpoint
CREATE INDEX "calificaciones_destino_idx" ON "calificaciones" USING btree ("destino_perfil_id");--> statement-breakpoint
CREATE INDEX "categorias_padre_idx" ON "categorias" USING btree ("padre_id");--> statement-breakpoint
CREATE UNIQUE INDEX "comunas_region_codigo_uq" ON "comunas" USING btree ("region_id","codigo");--> statement-breakpoint
CREATE INDEX "comunas_nombre_idx" ON "comunas" USING btree ("nombre");--> statement-breakpoint
CREATE INDEX "eventos_entidad_idx" ON "eventos" USING btree ("entidad","entidad_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invitaciones_uq" ON "invitaciones" USING btree ("necesidad_id","perfil_id");--> statement-breakpoint
CREATE INDEX "invitaciones_perfil_idx" ON "invitaciones" USING btree ("perfil_id");--> statement-breakpoint
CREATE INDEX "items_perfil_idx" ON "items" USING btree ("perfil_id");--> statement-breakpoint
CREATE INDEX "items_categoria_idx" ON "items" USING btree ("categoria_id");--> statement-breakpoint
CREATE INDEX "mensajes_conversacion_idx" ON "mensajes" USING btree ("conversacion_id");--> statement-breakpoint
CREATE INDEX "necesidades_estado_idx" ON "necesidades" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "necesidades_comuna_idx" ON "necesidades" USING btree ("comuna_id");--> statement-breakpoint
CREATE INDEX "necesidades_categoria_idx" ON "necesidades" USING btree ("categoria_id");--> statement-breakpoint
CREATE INDEX "operaciones_comprador_idx" ON "operaciones" USING btree ("comprador_perfil_id");--> statement-breakpoint
CREATE INDEX "operaciones_proveedor_idx" ON "operaciones" USING btree ("proveedor_perfil_id");--> statement-breakpoint
CREATE UNIQUE INDEX "perfil_roles_uq" ON "perfil_roles" USING btree ("perfil_id","rol");--> statement-breakpoint
CREATE INDEX "perfiles_comuna_idx" ON "perfiles" USING btree ("comuna_id");--> statement-breakpoint
CREATE INDEX "perfiles_disponible_idx" ON "perfiles" USING btree ("disponible_ahora");--> statement-breakpoint
CREATE INDEX "perfiles_nombre_idx" ON "perfiles" USING btree ("nombre");--> statement-breakpoint
CREATE UNIQUE INDEX "propuestas_uq" ON "propuestas" USING btree ("necesidad_id","perfil_id");--> statement-breakpoint
CREATE INDEX "propuestas_perfil_idx" ON "propuestas" USING btree ("perfil_id");--> statement-breakpoint
CREATE INDEX "publicaciones_comuna_idx" ON "publicaciones" USING btree ("comuna_id");--> statement-breakpoint
CREATE INDEX "publicaciones_tipo_idx" ON "publicaciones" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX "publicaciones_creado_idx" ON "publicaciones" USING btree ("creado_en");--> statement-breakpoint
CREATE UNIQUE INDEX "regiones_pais_codigo_uq" ON "regiones" USING btree ("pais_id","codigo");--> statement-breakpoint
CREATE UNIQUE INDEX "verificaciones_uq" ON "verificaciones" USING btree ("perfil_id","tipo");--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_account_id_uq" ON "account" USING btree ("issuer","account_id");--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");
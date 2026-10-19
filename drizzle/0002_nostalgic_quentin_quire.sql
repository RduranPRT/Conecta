CREATE TYPE "public"."estado_solicitud_categoria" AS ENUM('pendiente', 'asignada', 'descartada');--> statement-breakpoint
CREATE TYPE "public"."tipo_identidad" AS ENUM('persona', 'empresa');--> statement-breakpoint
CREATE TABLE "categoria_rubros" (
	"categoria_id" integer NOT NULL,
	"rubro_id" integer NOT NULL,
	CONSTRAINT "categoria_rubros_categoria_id_rubro_id_pk" PRIMARY KEY("categoria_id","rubro_id")
);
--> statement-breakpoint
CREATE TABLE "solicitudes_categoria" (
	"id" serial PRIMARY KEY NOT NULL,
	"perfil_id" integer NOT NULL,
	"texto" text NOT NULL,
	"rubro_id" integer,
	"estado" "estado_solicitud_categoria" DEFAULT 'pendiente' NOT NULL,
	"categoria_asignada_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"resuelto_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "categorias" ADD COLUMN "oficio" text;--> statement-breakpoint
ALTER TABLE "categorias" ADD COLUMN "ejemplos" text;--> statement-breakpoint
ALTER TABLE "perfiles" ADD COLUMN "tipo_identidad" "tipo_identidad" DEFAULT 'persona' NOT NULL;--> statement-breakpoint
ALTER TABLE "categoria_rubros" ADD CONSTRAINT "categoria_rubros_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categoria_rubros" ADD CONSTRAINT "categoria_rubros_rubro_id_categorias_id_fk" FOREIGN KEY ("rubro_id") REFERENCES "public"."categorias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes_categoria" ADD CONSTRAINT "solicitudes_categoria_perfil_id_perfiles_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes_categoria" ADD CONSTRAINT "solicitudes_categoria_rubro_id_categorias_id_fk" FOREIGN KEY ("rubro_id") REFERENCES "public"."categorias"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes_categoria" ADD CONSTRAINT "solicitudes_categoria_categoria_asignada_id_categorias_id_fk" FOREIGN KEY ("categoria_asignada_id") REFERENCES "public"."categorias"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categoria_rubros_rubro_idx" ON "categoria_rubros" USING btree ("rubro_id");--> statement-breakpoint
CREATE INDEX "solicitudes_categoria_estado_idx" ON "solicitudes_categoria" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "solicitudes_categoria_perfil_idx" ON "solicitudes_categoria" USING btree ("perfil_id");
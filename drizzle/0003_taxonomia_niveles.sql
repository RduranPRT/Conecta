CREATE TYPE "public"."nivel_categoria" AS ENUM('rubro', 'subgrupo', 'item', 'oficio');--> statement-breakpoint
CREATE TYPE "public"."origen_categoria" AS ENUM('semilla', 'admin');--> statement-breakpoint
ALTER TYPE "public"."estado_solicitud_categoria" ADD VALUE 'aprobada';--> statement-breakpoint
ALTER TYPE "public"."estado_solicitud_categoria" ADD VALUE 'fusionada';--> statement-breakpoint
ALTER TYPE "public"."estado_solicitud_categoria" ADD VALUE 'rechazada';--> statement-breakpoint
ALTER TYPE "public"."rol_actor" ADD VALUE 'partner';--> statement-breakpoint
CREATE TABLE "categoria_padres" (
	"categoria_id" integer NOT NULL,
	"padre_id" integer NOT NULL,
	CONSTRAINT "categoria_padres_categoria_id_padre_id_pk" PRIMARY KEY("categoria_id","padre_id")
);
--> statement-breakpoint
CREATE TABLE "perfil_intereses" (
	"perfil_id" integer NOT NULL,
	"categoria_id" integer NOT NULL,
	CONSTRAINT "perfil_intereses_perfil_id_categoria_id_pk" PRIMARY KEY("perfil_id","categoria_id")
);
--> statement-breakpoint
ALTER TABLE "categorias" ADD COLUMN "nivel" "nivel_categoria" DEFAULT 'subgrupo' NOT NULL;--> statement-breakpoint
ALTER TABLE "categorias" ADD COLUMN "origen" "origen_categoria" DEFAULT 'semilla' NOT NULL;--> statement-breakpoint
ALTER TABLE "categoria_padres" ADD CONSTRAINT "categoria_padres_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categoria_padres" ADD CONSTRAINT "categoria_padres_padre_id_categorias_id_fk" FOREIGN KEY ("padre_id") REFERENCES "public"."categorias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfil_intereses" ADD CONSTRAINT "perfil_intereses_perfil_id_perfiles_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfil_intereses" ADD CONSTRAINT "perfil_intereses_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categoria_padres_padre_idx" ON "categoria_padres" USING btree ("padre_id");--> statement-breakpoint
CREATE INDEX "categorias_nivel_idx" ON "categorias" USING btree ("nivel");
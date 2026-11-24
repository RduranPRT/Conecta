CREATE TABLE "imagenes" (
	"id" serial PRIMARY KEY NOT NULL,
	"perfil_id" integer NOT NULL,
	"item_id" integer,
	"orden" integer DEFAULT 0 NOT NULL,
	"es_principal" boolean DEFAULT false NOT NULL,
	"clave_detalle" text NOT NULL,
	"clave_miniatura" text NOT NULL,
	"ancho" integer NOT NULL,
	"alto" integer NOT NULL,
	"autor_perfil_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "imagenes" ADD CONSTRAINT "imagenes_perfil_id_perfiles_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imagenes" ADD CONSTRAINT "imagenes_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imagenes" ADD CONSTRAINT "imagenes_autor_perfil_id_perfiles_id_fk" FOREIGN KEY ("autor_perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "imagenes_item_idx" ON "imagenes" USING btree ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "imagenes_principal_uq" ON "imagenes" USING btree ("item_id") WHERE es_principal and item_id is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "imagenes_perfil_uq" ON "imagenes" USING btree ("perfil_id") WHERE item_id is null;
CREATE TABLE "guardados" (
	"publicacion_id" integer NOT NULL,
	"perfil_id" integer NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guardados_publicacion_id_perfil_id_pk" PRIMARY KEY("publicacion_id","perfil_id")
);
--> statement-breakpoint
ALTER TABLE "guardados" ADD CONSTRAINT "guardados_publicacion_id_publicaciones_id_fk" FOREIGN KEY ("publicacion_id") REFERENCES "public"."publicaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardados" ADD CONSTRAINT "guardados_perfil_id_perfiles_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE cascade ON UPDATE no action;
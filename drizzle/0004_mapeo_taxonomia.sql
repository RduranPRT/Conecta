-- B3 · Mapeo de la taxonomía de octubre a los niveles nuevos.
-- No cambia ids ni slugs: perfiles, publicaciones, necesidades y catálogos
-- siguen apuntando a las mismas filas. Es repetible sin efectos.
UPDATE "categorias" SET "nivel" = 'rubro' WHERE "padre_id" IS NULL AND "slug" LIKE 'rubro-%';--> statement-breakpoint
UPDATE "categorias" SET "nivel" = 'subgrupo' WHERE NOT ("padre_id" IS NULL AND "slug" LIKE 'rubro-%');--> statement-breakpoint
INSERT INTO "categoria_padres" ("categoria_id", "padre_id")
SELECT "id", "padre_id" FROM "categorias" WHERE "padre_id" IS NOT NULL
UNION
SELECT "categoria_id", "rubro_id" FROM "categoria_rubros"
ON CONFLICT DO NOTHING;

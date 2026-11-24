# B5 · Fotografías en perfiles y catálogo

**Cubre:** N01 · N02 · P07 · D3 · D4

«Publicación» en el encargo es aquí un elemento de **Mis productos y servicios** (`items`). Los avisos
del feed (`publicaciones`) no cambian.

## Almacenamiento

`src/lib/almacenamiento/` expone `subir`, `eliminar` y `urlPublica`:

| `STORAGE_DRIVER` | Implementación |
|---|---|
| `r2` | Cloudflare R2 con `@aws-sdk/client-s3`; URL pública desde `R2_PUBLIC_URL` |
| `local` | Disco (`ALMACEN_LOCAL_DIR`, por omisión `.almacen/`), servido por `/api/archivos/…` |

Sin `STORAGE_DRIVER`: en desarrollo, `local`; en producción, la carga queda **deshabilitada con un
mensaje claro** (el disco de Railway se borra en cada despliegue). `src/lib/env.ts` valida todo junto.

## Procesamiento (`procesarImagen`)

1. Máximo 5 MB, medido en el servidor sobre los bytes recibidos.
2. Tipo real por *magic bytes*: JPG, PNG o WebP. La extensión y el tipo declarado no cuentan.
3. `sharp`: rota según EXIF, **descarta todos los metadatos** (GPS incluido), limita píxeles y genera
   WebP de detalle (máx. 1600 px) y miniatura (400 px).

## Datos

Tabla `imagenes`: `perfil_id` (dueño), `item_id` (NULL = foto del perfil), `orden`, `es_principal`,
claves por tamaño, ancho, alto, autor y fecha. Índices únicos parciales: una principal por ítem y una
foto por perfil. `perfiles.avatar_url` e `items.imagen_url` guardan la URL de la miniatura principal:
así todas las tarjetas existentes la muestran sin otra consulta.

## Reglas

1. Perfil: 1 foto; subir otra reemplaza. Ítem: 1 principal + 4; la sexta se rechaza (la cuenta se hace
   con el ítem bloqueado, dos cargas a la vez no se cuelan).
2. Solo quien administra el perfil sube, ordena, marca principal o borra.
3. Al borrar la principal, la siguiente en orden pasa a serlo.
4. Al eliminar una imagen o un ítem se borran sus objetos después de confirmar en la base. Si el
   almacenamiento falla, queda el evento `imagen.objeto_huerfano` con la clave para limpiarlo.
5. Sin foto: avatar con iniciales o icono.
6. Las imágenes son públicas. No se listan ni se adivinan: la clave lleva un UUID.
7. Catálogo: crear, editar, retirar, volver a publicar y **eliminar**.
8. Los enlaces a fotos externas que ya existían se siguen mostrando; ya no se piden.

## Criterios de aceptación

| Criterio | Prueba |
|---|---|
| Marraqueta y Hogaza con fotos, vistas por un visitante en catálogo y detalle | `tests/e2e/fotos.spec.ts` |
| Foto del gasfíter junto a su nombre y especialidad en resultados | ídem |
| 6 MB, `.exe` renombrado y sexta foto: rechazo con mensaje claro | `tests/unit/imagenes.test.ts` + e2e |
| Sin EXIF/GPS | `tests/unit/imagenes.test.ts` |
| Al reemplazar o eliminar, el objeto anterior deja de existir | `tests/e2e/fotos.spec.ts` + unit del driver local |

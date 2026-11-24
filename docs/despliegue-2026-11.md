# Despliegue · noviembre 2026

Pasos para Rodrigo, en orden. Nada de esto se ha hecho todavía.

## 0. Antes del 1-dic-2026: `railway.json` deja de leerse

Railway avisa que deja de leer `railway.json` el **1-dic-2026**. Ese archivo es el que corre las
migraciones al arrancar. Si se despliega después sin reemplazarlo, la versión nueva puede arrancar
sin sus tablas.

En Railway → servicio Conecta → Settings → Deploy, deja escrito:

- **Custom Start Command:** `npm run db:migrate && npm run db:catalogos && npm run start`
- **Healthcheck Path:** `/api/salud`, con 120 segundos

(La alternativa es `railway config migrate`, que crea `.railway/railway.ts`.)

## 1. Respaldo

Saca un respaldo de PostgreSQL antes de desplegar. Las migraciones solo agregan (tablas, columnas e
índices) y se probaron sobre una copia sembrada con `main`, no sobre los datos de producción.

## 2. Crear el bucket en Cloudflare R2

1. Cloudflare → R2 → **Create bucket**: `conecta-fotos`.
2. Bucket → Settings → **Public access** → Custom Domains → conecta `fotos.tudominio.cl`. (Para probar
   sirve la URL `r2.dev`, que Cloudflare limita y no recomienda en producción.)
3. R2 → **Manage API Tokens** → Create: permiso *Object Read & Write*, **solo** para ese bucket.
   Guarda el Access Key ID y el Secret: se muestran una vez.
4. El Account ID está en la página principal de R2.

No hace falta configurar CORS: las fotos se suben desde el servidor.

## 3. Variables nuevas en Railway

| Variable | Valor | Obligatoria |
|---|---|---|
| `STORAGE_DRIVER` | `r2` | Para habilitar fotos |
| `R2_ACCOUNT_ID` | Account ID de Cloudflare | Con `r2` |
| `R2_ACCESS_KEY_ID` | del token | Con `r2` |
| `R2_SECRET_ACCESS_KEY` | del token | Con `r2` |
| `R2_BUCKET` | `conecta-fotos` | Con `r2` |
| `R2_PUBLIC_URL` | `https://fotos.tudominio.cl` (sin barra final) | Con `r2` |

Sin ellas, el sitio funciona igual y la carga de fotos responde «todavía no está habilitada». **No**
uses `STORAGE_DRIVER=local` en Railway: su disco se borra en cada despliegue.

`R2_PUBLIC_URL` debe ser definitiva: la dirección de la miniatura queda guardada en cada perfil y
producto.

## 4. Desplegar y revisar

1. Integrar la rama `feat/vitrina-taxonomia-registro` en `main`.
2. En los registros deben aparecer `taxonomía: 15 rubros, 90 subgrupos, 373 ítems y 92 oficios` y
   `RUT heredados: N de M válidos`.
3. En incógnito, abrir un perfil y confirmar que no hay teléfono.
4. Subir una foto de perfil y abrirla desde `R2_PUBLIC_URL`.
5. Borrar el almacenamiento en caché si hubiera un CDN delante: las páginas antiguas traían teléfonos.

## Volver atrás

Las migraciones no quitan nada, así que el código anterior puede volver a desplegarse sobre la base
nueva. Está razonado, no ejecutado. Lo que se apruebe en «Otro» como ítem nuevo no se vería en la
versión anterior como subgrupo.

# 05 · Diagnóstico · noviembre 2026

Paso 0 del encargo «Vitrina pública, taxonomía y registro». Fecha: 24-nov-2026.
Escrito antes de modificar código.

## 1. Estado git

| Dato | Valor |
|---|---|
| Rama de partida | `main`, igual a `origin/main` (0 adelante, 0 atrás) |
| Último commit | `3aedd1e` «Aplicar solicitudes de Álvaro y Paloma de octubre (S01-S23, C01-C06, P01-P08)» |
| Rama de trabajo | `feat/vitrina-taxonomia-registro` |
| Sin confirmar | solo carpetas sin seguimiento: `.claude/` y `Claude outputs/` (no se tocan) |
| Ubicación | `C:\Rduran\Claude Code\Conecta`, clon local fuera de Google Drive (regla 9) |
| `c11bbe6` | **No existe con ese hash, pero su contenido ya está** en `2243d0a` (mismo mensaje y mismos dos archivos). No se aplica el parche. |

Línea base verificada: `typecheck`, `build` y 30 pruebas en verde; `db:migrate` y `db:seed` sobre
una base vacía crean 40 perfiles (33 actores + 7 de prueba).

## 2. Esquema real

| Tema | Tablas | Observación |
|---|---|---|
| Territorio | `paises` → `regiones` → `comunas` | 16 regiones y 346 comunas con CUT y centroide (`scripts/territorio-cl.ts`). **No** existe `division`. |
| Taxonomía | `categorias` (`padre_id`), `categoria_rubros` | Dos niveles: 13 rubros y 67 especialidades. El oficio es un texto, no una entidad. No hay ítems concretos. |
| Perfil y roles | `perfiles`, `perfil_roles`, `perfil_categorias` | Roles: persona, prestador, negocio, proveedor, productor. Falta Partner. No hay intereses separados. |
| «Otro» | `solicitudes_categoria` | Estados pendiente / asignada / descartada. No permite crear un ítem nuevo desde la pantalla. |
| Catálogo | `items` | Lo que vende o presta un perfil. **No confundir con «ítem» de la taxonomía.** |
| Publicaciones | `publicaciones` | Avisos con fecha en el feed. |
| Imágenes | `items.imagen_url`, `publicaciones.imagen_url`, `perfiles.avatar_url` | Solo enlaces. No hay tabla de imágenes ni carga de archivos. |
| Guardados | `guardados` | Por publicación. |

Del modelo v1 de septiembre (`division`, `membresia`, UUIDv7, módulo M4) **no hay nada aplicado** en
este repositorio. Existe un esqueleto distinto en Drive (`04-Desarrollo/app`, con `src/core`,
`tests/`, `spec/` y los recorridos R1–R6), pero casi no tiene código. Manda este repositorio.

## 3. Qué ya existe de cada solicitud

| Código | Estado | Evidencia |
|---|---|---|
| N01 | Falta | `mi-catalogo/formulario-item.tsx` pide un enlace, no un archivo |
| N02 | Falta | `avatar_url` existe, sin pantalla para cargarlo |
| N03 | Parcial | Buscar, mapa, ficha y explorar abren sin sesión; `/inicio` exige sesión; **el contacto se filtra** (ver §5) |
| S01 | Parcial | «Cómo funciona» en `src/app/page.tsx`, extenso y fuera de Inicio |
| S02 | Parcial | Igual que N03. La barra del visitante no es la de tres accesos |
| S03 | Hecho | Portada con «¿Qué necesitas?» |
| S04 | Parcial | Alta en dos pantallas más 2 o 3 pasos; comuna obligatoria; no pide RUT |
| S05 | Parcial | `casos/requisitos.ts` cubre 4 acciones; falta contactar, ofrecer y catálogo |
| S06 | Parcial | Franja compacta; falta comprobarlo con una prueba a 390×844 |
| S07 | Parcial | Prefijo fijo aparte; acepta de 6 a 12 dígitos en vez de 9 |
| S08 | Parcial | «Crear mi perfil»; la primera pantalla dice «Crear cuenta y seguir» |
| S09 | Parcial | Indicador de pasos en el segundo formulario |
| S10 | Parcial | `/bienvenida` e Inicio con sesión |
| S11 | Parcial | «Otro» y cola; falta crear el ítem, fusionar y buscar por ese texto |
| S12 | Parcial | Familias cargadas; la búsqueda no distingue «no existe» de «no hay oferta» |
| S13 | Parcial | Roles separados de especialidades; falta separar oficio e ítem |
| S14 | Parcial | Rubro → especialidad → resultados; falta el nivel ítem |
| S15 | Hecho | `perfil_categorias` N:M, varios roles |
| S16 | Parcial | Se filtra por tipo; un particular ve sitio web, dirección y RUT |
| S17 | Parcial | Una fila por especialidad; no hay ítems todavía |
| S18 | Parcial | Sinónimos y ejemplos por especialidad |
| S19 | Falta | El feed usa lo que ofrece como si fuera interés |
| S20 | Parcial | Indicador en Buscar y Mapa; falta en Inicio y no se recuerda |
| S21 | Fuera | Falta la consulta exacta de Diego |
| S22 | Hecho | Una cuenta con varios roles |
| S23 | Parcial | Etiqueta en `TarjetaPublicacion`; falta en la tarjeta destacada y en las fichas |
| S24, S25 | Fuera | Posterior |
| C01 | Parcial | = S13 |
| C02 | Parcial | = S17 |
| C03 | Parcial | = S14 |
| C04 | Hecho | = S15 |
| C05 | Hecho | Familias legales, contables, financieras, diseño, marketing y audiovisual |
| C06 | Parcial | 13 rubros; el abastecimiento B2B está mezclado con las tiendas |
| P01 | Hecho | 346 comunas; el selector no permite escribir para buscar |
| P02 | Parcial | Existe «Repuestos automotrices», sin especialidades |
| P03 | Parcial | Edición completa en Mi perfil; exige comuna a todos |
| P04 | Parcial | = S13 + filtros |
| P05 | Parcial | = S16 |
| P06 | Hecho | Varios roles por perfil |
| P07 | Parcial | Crear, editar, retirar y republicar; sin fotos, detalle ni eliminar |
| P08 | Parcial | Un recorrido probado a mano en octubre; sin e2e |

## 4. Infraestructura

- **Variables en Railway** (solo nombres, no se leyeron valores): `ADMIN_EMAILS`,
  `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DATABASE_URL`, `NEXT_PUBLIC_APP_URL` y las `RAILWAY_*`.
  No hay `ANTHROPIC_API_KEY`: la interpretación corre con reglas.
- **Almacenamiento de archivos:** ninguno. No existe `env.ts`.
- **Despliegue:** Railway sigue el repositorio y arranca con `startCommand` de `railway.json`:
  `db:migrate && db:catalogos && start`. `db:catalogos` es idempotente: ahí va el mapeo de datos.
- **pg-boss:** no está configurado.
- **Pruebas:** Vitest (30). Playwright está como librería, sin `@playwright/test` ni pruebas.
  No hay navegadores de Playwright instalados; en Windows se usa Microsoft Edge (`channel`).
- **Base local:** la de `.env` (puerto 54329) no está corriendo. Se verifica con un PostgreSQL 17
  embebido, fuera del repositorio, con tres bases: vacía, copia sembrada con `main` y e2e.

## 5. Riesgos y contradicciones

1. **Crítico, en producción hoy:** `/p/[slug]` entrega el **teléfono** y el sitio web sin sesión
   (comprobado el 24-nov con una petición sin cookies al sitio público). Se corrige en B1.
2. **Crítico:** la server action `accionPerfilPorSlug` devuelve la fila completa del perfil (RUT,
   teléfono, correo, `usuario_id`) a cualquiera. Nadie la usa: se elimina en B1.
3. **Alto, fuera del código:** Railway deja de leer `railway.json` el **1-dic-2026** («hard cutoff»,
   según su documentación). Después de esa fecha el `startCommand` que corre las migraciones podría
   no ejecutarse. Hay que pasarlo a la configuración del servicio (o usar `railway config migrate`)
   **antes** de desplegar esta rama. No se cambia aquí porque toca el despliegue.
4. **Medio:** `accionIngreso` redirige a cualquier `destino`, incluso externo. Se corrige en B1.
5. **Medio:** las necesidades muestran a cualquier visitante todas las propuestas con sus montos y la
   traza. Se restringe al visitante en B1; con sesión no cambia.
6. **Medio:** los textos libres pueden traer teléfonos, correos o redes escritos a mano. Para el
   visitante se ocultan en el servidor.
7. **Contradicción de arquitectura:** el encargo pide capa de repositorios; en este código los casos
   de uso consultan Drizzle directamente. Crear esa capa sería reescribir todo. Se mantiene el
   patrón existente: **casos de uso con `perfilId` explícito, nunca la sesión**.
8. **Contradicción de nombres:** el encargo llama `solicitud_categoria` y `division` a tablas que
   aquí son `solicitudes_categoria` y `regiones`/`comunas`. Se conservan los nombres reales.
9. **RUT heredados:** los del seed son inventados y sin dígito verificador válido. Un RUT no válido o
   repetido se trata como «falta»: se pide, sin bloquear la navegación.
10. **R1–R6:** no había pruebas e2e. Los seis recorridos viven en los casos de uso y los ejercita el
    seed. En B7 se agregan como prueba e2e.
11. **Recuperación de contraseña:** no existe en este repositorio (no hay correo saliente). No se toca.
12. **Coordenadas:** un perfil sin ubicación exacta guarda el centroide de su comuna. Por eso «pin
    exacto» se deduce comparando con el centroide.

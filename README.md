# Conecta · prototipo web

Plataforma territorial que conecta personas, prestadores de servicios, negocios,
proveedores y productores dentro de una misma comuna. Primera versión montable en
Railway: navegación completa, núcleo transaccional funcionando y la capa de IA
resuelta por reglas con un enganche listo para el modelo.

> El buscador encuentra · el mapa descubre · el feed conecta · las operaciones
> permiten concretar · la IA coordina.

---

## Levantarlo en tu equipo (5 minutos)

Necesitas Node 20 o superior y un PostgreSQL 16+.

```bash
npm install
cp .env.example .env          # y edita DATABASE_URL y BETTER_AUTH_SECRET
npm run db:migrate            # crea el esquema
npm run db:seed               # 33 actores, 8 necesidades, un ciclo completo
npm run dev                   # http://localhost:3000
```

Si no tienes Postgres a mano:

```bash
docker run --name conecta-db -e POSTGRES_USER=conecta -e POSTGRES_PASSWORD=conecta \
  -e POSTGRES_DB=conecta -p 5432:5432 -d pgvector/pgvector:pg17
```

### Cuentas de prueba

Todas usan la contraseña `conecta2026`:

| Correo | Para ver |
|---|---|
| `rodrigo-fuentes@conecta.demo` | una persona que publica necesidades y adjudica |
| `servitec-linea-blanca@conecta.demo` | un prestador con oportunidades y una operación calificada |
| `panaderia-dona-rosa@conecta.demo` | un negocio que compra y vende a la vez |
| `distribuidora-el-molino@conecta.demo` | un proveedor cotizando |

Cualquier actor del seed tiene cuenta: el correo es `<slug>@conecta.demo`.

---

## Montarlo en Railway

1. **Repositorio.** Sube esta carpeta a GitHub (`git init && git add . && git commit`).
2. **Proyecto.** En Railway: *New Project → Deploy from GitHub repo*. Región `us-east4`.
3. **Base de datos.** *New → Database → PostgreSQL* en el mismo proyecto.
4. **Variables del servicio web:**

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` ← referencia, no la cadena pegada |
   | `BETTER_AUTH_SECRET` | salida de `openssl rand -base64 32` |
   | `NEXT_PUBLIC_APP_URL` | `https://<tu-dominio>` |
   | `BETTER_AUTH_URL` | igual que el anterior |
   | `ADMIN_EMAILS` | tu correo, para entrar al Centro de Control |

   La referencia `${{Postgres.DATABASE_URL}}` hace que el tráfico viaje por la red
   privada: no se paga egreso y la base nunca queda expuesta a internet.

5. **Despliegue.** Railway detecta Next.js con Nixpacks. `railway.json` ya define el
   arranque (`npm run db:migrate && npm run start`) y el healthcheck (`/api/salud`),
   así que **las migraciones se aplican solas en cada despliegue**.
6. **Datos semilla** (una vez, opcional): `railway run npm run db:seed`.
7. **Dominio.** *Settings → Networking → Generate Domain*, o apunta `app.conecta.cl`.

Pendientes del día 2 que Railway no activa solo: **respaldos diarios** y una
**restauración de prueba** antes de mostrar el prototipo.

---

## Qué hay construido

### Navegación (la del prompt, completa)

`Inicio · Buscar · Mapa · Descubrir · Publicar · Mensajes · Actividad · Asistente · Mi perfil`,
más la ficha pública `/p/<slug>`, el detalle de necesidad `/necesidades/<id>` y el
`Centro de Control`. En teléfono, barra inferior; en escritorio, barra lateral.

### Los seis recorridos, de punta a punta

| | Recorrido | Dónde se ve |
|---|---|---|
| R1 | Alta e identidad multi-rol | `/registro` → `/onboarding` → `/mi-perfil` |
| R2 | Publicar una necesidad | `/publicar` (interpreta el texto y dispara el match) |
| R3 | Descubrir e invitar a cotizar | `/necesidades/<id>` · actores compatibles |
| R4 | Cotizar | `/necesidades/<id>` · formulario de propuesta |
| R5 | Comparar y adjudicar | `/necesidades/<id>` · cuadro comparativo |
| R6 | Calificación mutua | `/actividad?vista=operaciones` |

### Las cuatro nociones territoriales, separadas

`ubicación física` (lat/lng) ≠ `territorio administrativo` (país → región → comuna)
≠ `zona de cobertura` (tabla `coberturas`) ≠ `radio de atención` (`perfiles.radio_km`).

### Una identidad, varios roles

`perfiles` + `perfil_roles`. Nadie crea una segunda cuenta para vender además de
comprar. La interfaz se adapta a los roles activos.

### Una sola fuente de verdad

El interruptor «Disponible ahora» del encabezado escribe una columna. Buscador,
mapa, ficha, feed, matching y asistente la leen en la misma petición siguiente.

---

## Cómo está organizado

```
src/
├── app/                    Pantallas (App Router) y acciones de servidor
│   ├── (app)/              Todo lo que requiere sesión
│   ├── (auth)/             Registro, ingreso y alta de ficha
│   ├── api/auth/           Better Auth
│   ├── api/salud/          Healthcheck de Railway
│   └── acciones.ts         Server actions: validan, llaman casos de uso, revalidan
├── components/             Interfaz reutilizable (ui.tsx, mapa, tarjetas, navegación)
├── db/                     schema.ts (dominio) · auth-schema.ts (Better Auth)
└── lib/
    ├── casos/              ← LAS REGLAS DEL NEGOCIO VIVEN AQUÍ
    │   ├── actores.ts      búsqueda unificada de actores
    │   ├── puntaje.ts      orden: distancia · relevancia · disponibilidad · reputación
    │   ├── necesidades.ts  publicar, calcular match, generar oportunidades, invitar
    │   ├── propuestas.ts   cotizar, adjudicar, registrar entrega, calificar
    │   ├── feed.ts         feed personalizado y publicaciones
    │   ├── perfil.ts       identidad, roles, categorías, cobertura, disponibilidad
    │   ├── mensajes.ts     conversaciones
    │   └── actividad.ts    paneles y pulso territorial
    ├── ia/                 interpretación (reglas | modelo) y asistente
    ├── geo.ts · formato.ts · sesion.ts · utils.ts
drizzle/                    Migraciones SQL legibles
scripts/                    migrate · seed · reset · datos de referencia
```

**La regla que habilita la Fase 2:** las pantallas no contienen reglas. Un botón y
un agente llaman a la misma función (`publicarNecesidad`, `adjudicar`, `calificar`),
con las mismas validaciones y la misma traza.

---

## La capa de IA

Un único punto de interpretación: `lib/ia/interpretar()`. Devuelve siempre la misma
estructura `Intencion` —categoría, comuna, cercanía, disponibilidad, tipo, roles,
presupuesto—, la consuman el buscador, la publicación de una necesidad o el asistente.

- **Sin `ANTHROPIC_API_KEY`:** interpreta un motor de reglas determinista. No cuesta,
  no falla y explica en pantalla qué entendió.
- **Con `ANTHROPIC_API_KEY`:** el modelo produce esa misma estructura. Si falla,
  responde algo inválido o se demora más de 8 segundos, vuelve a reglas sin que el
  usuario lo note. Los ids que devuelve se validan contra la base: no puede inventar
  una categoría o una comuna que no exista.

Cada búsqueda queda registrada en la tabla `busquedas` con su interpretación y el
motor que la produjo, para poder auditar a la IA cuando entre el modelo.

Los diez agentes de usuario y los ocho administrativos están en el catálogo y se
pueden contratar y configurar con su nivel de autonomía (1 recomienda · 2 prepara ·
3 ejecuta). **Todavía no ejecutan**: eso es la Fase 2. Las acciones sensibles
—pagos, contrataciones, compromisos— requieren autorización humana explícita en
cualquier nivel.

---

## Qué NO trae esta versión (a propósito)

- **Pagos por la plataforma.** El modelo ya tiene `operaciones.pago_estado` y la
  traza completa; falta el módulo y su webhook. Decisión A-04, pendiente.
- **Agentes ejecutando.** Catálogo, contratación y niveles sí; ejecución no.
- **Verificación real de RUT.** Se registra y se aprueba a mano en el Centro de
  Control; no consulta al SII.
- **Subida de archivos.** Los adjuntos están modelados; falta conectar Cloudflare R2.
- **Correo.** Resend no está conectado: no se envían avisos todavía.
- **App móvil.** La web es responsiva; iOS y Android son otra etapa.
- **pgvector en uso.** La extensión se habilita en la migración para que la Fase 2 no
  obligue a migrar, pero nada la usa aún.

---

## Comandos

```bash
npm run dev          # desarrollo
npm run build        # compilar
npm run start        # producción (usa $PORT)
npm run typecheck    # tsc --noEmit
npm run test         # vitest: interpretación y orden de resultados
npm run db:generate  # nueva migración desde el esquema
npm run db:migrate   # aplicar migraciones
npm run db:seed      # datos semilla
npm run db:reset     # vaciar datos (el esquema queda)
```

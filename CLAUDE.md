# CLAUDE.md · Conecta

Contexto que Claude debe leer al abrir una sesión sobre este repositorio.

## Qué es

Prototipo funcional de una plataforma territorial: personas, prestadores de
servicios, negocios, proveedores y productores de una misma comuna se encuentran,
acuerdan y califican operaciones. Fase 1 construida; Fase 2 (agentes de IA
ejecutando) declarada pero no implementada.

Especificación de origen: `Promt Desarrollo MVP V1.txt` en el proyecto de Claude
«Portal Proveedores - Conecta».

## Stack

Next.js 15 (App Router, TypeScript) · Tailwind 3 · PostgreSQL con Drizzle ORM ·
Better Auth · Leaflet + OpenStreetMap · Vitest. Despliegue en Railway con Nixpacks.

## La regla de arquitectura, antes que cualquier otra cosa

Cuatro capas: **Pantallas → Casos de uso → Repositorios → PostgreSQL.**

Las reglas del negocio viven en `src/lib/casos/`, en funciones que reciben datos
planos y un `perfilId` explícito —nunca la sesión. Las pantallas y las server
actions de `src/app/acciones.ts` solo validan la entrada, llaman al caso de uso y
revalidan la ruta.

**Si vas a escribir una regla dentro de un componente o de una server action,
detente.** En la Fase 2, un agente que «invita a cotizar» debe poder llamar la
misma función que el botón, con las mismas validaciones y la misma traza.

## Convenciones

- **Todo en español**: nombres de archivo, funciones, variables, tablas, columnas,
  comentarios y textos de interfaz. Sin mezclar idiomas.
- Nombres de archivo en minúsculas con guiones (`tarjeta-actor.tsx`).
- Componentes de servidor por defecto; `"use client"` solo cuando hace falta estado
  o eventos.
- Formularios con `useActionState` sobre server actions que devuelven
  `{ ok?, error?, mensaje? }`.
- Estilos con las clases utilitarias y los componentes de `src/components/ui.tsx`.
  Los colores salen de variables CSS (`--marca`, `--texto`, `--tenue`…): no
  escribas colores literales, así el modo oscuro sigue funcionando.
- Toda mutación relevante registra un evento con `registrarEvento`. La traza es
  parte del producto, no telemetría.
- Nada asume Chile ni CLP como únicos: la moneda viaja con el dato y el territorio
  es `país → región → comuna`.

## Base de datos

`src/db/schema.ts` es la fuente de verdad. Para cambiarla:

```bash
# 1. editar src/db/schema.ts
npm run db:generate      # genera el SQL en drizzle/
npm run db:migrate       # lo aplica
```

Nunca edites a mano una migración ya aplicada. `src/db/auth-schema.ts` lo fija
Better Auth: si actualizas la librería, regenera con `npx @better-auth/cli generate`
y revisa columnas nuevas (la 1.7 agregó `account.issuer`).

## Verificación

Antes de dar algo por terminado:

```bash
npm run typecheck && npm run test && npm run build
npm run db:reset && npm run db:seed     # el seed ejercita los casos de uso reales
```

El seed no inserta el resultado de las reglas: publica necesidades, cotiza,
adjudica y califica llamando a los casos de uso. Si una regla se rompe, el seed
falla. Manténlo así.

## Qué no hacer

- No agregar pagos, escrow ni comisiones sin cerrar antes la decisión A-04.
- No poner agentes a ejecutar acciones sin autorización humana explícita para
  pagos, contrataciones, compromisos contractuales y cambios de precio.
- No hacer que la reputación se pueda comprar, editar o promocionar. El
  patrocinio afecta visibilidad, nunca confianza, y siempre va marcado.
- No convertir el mapa en el contenedor de la aplicación: es una pestaña más.
- No duplicar la lógica de búsqueda. Si necesitas listar actores, usa
  `buscarActores`; si necesitas ordenarlos, usa `puntuar`.

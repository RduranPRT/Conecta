# B2 · Territorio completo de Chile

**Cubre:** P01 · S20 · D8

## Decisión: se amplía `regiones`/`comunas`, no se adopta `division`

El diagnóstico muestra que `division` no existe y que las 16 regiones y 346 comunas ya están cargadas
con su CUT y centroide en `regiones`/`comunas`, con siete tablas que las referencian por clave
foránea. Adoptar `division` obligaría a migrar todas esas referencias sin que ninguna solicitud gane
algo. La preferencia del encargo estaba condicionada a una migración segura: aquí el riesgo no se
paga. Si la Fase 2 suma otros países con niveles distintos, se reevalúa.

## Fuente

`scripts/territorio-cl.ts`: Código Único Territorial (SUBDERE) y centroides aproximados
(OpenStreetMap). `db:catalogos` lo carga en cada despliegue; corrige Macul (13118) y Maipú (13119)
sobre las filas existentes, sin cambiar sus `id`. Ningún perfil pierde su comuna.

## Reglas

1. **Selector con búsqueda:** se escribe y se filtra sin tildes ni mayúsculas («nunoa» → Ñuñoa,
   «ohiggins» por región). Sigue siendo un solo componente para registro, perfil, publicar, filtros
   y mapa. Se puede usar con teclado.
2. **Territorio que se explora:** se decide en este orden: comuna en la URL → la que la persona
   eligió antes (cookie `territorio`, sin datos personales) → la de su perfil → comuna piloto.
   `territorioExplorado` es la única regla.
3. Inicio, Buscar y Mapa dicen «Explorando: Ñuñoa, RM · Cambiar».
4. El territorio elegido **filtra** Buscar. Si ahí no hay oferta se dice, y se muestran los
   resultados de otras comunas ordenados por distancia, con esa explicación. Si la comuna viene solo
   del perfil o del piloto, ordena por cercanía pero no esconde nada.
5. Un perfil sin punto exacto se ubica en el centroide de su comuna. Un perfil sin comuna no aparece
   en el mapa.

## Criterios de aceptación

| Criterio | Prueba |
|---|---|
| 16 regiones y 346 comunas únicas, con la cuenta por región | `tests/unit/territorio.test.ts` |
| Putre, Ñuñoa, Chillán y Cabo de Hornos: perfil, búsqueda y mapa | `tests/e2e/territorio.spec.ts` |
| Los 33 actores semilla mantienen su comuna tras migrar | verificación sobre copia de la base anterior (B7) |

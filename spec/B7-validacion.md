# B7 · Validación integral

**Cubre:** P08 · cierre de C01–C06 · regresión

| Persona | Dónde se prueba (Playwright, 390×844) |
|---|---|
| Tienda de repuestos (empresa) | `registro.spec.ts`, `recorridos.spec.ts` (catálogo con foto y búsqueda por rubro, ítem, rol y comuna), `taxonomia.spec.ts` |
| Técnico independiente (prestador) | `registro.spec.ts`, `recorridos.spec.ts` (R3–R6 desde el lado que cotiza) |
| Comprador particular | `registro.spec.ts`, `recorridos.spec.ts` (R1, R2, R5, R6) |
| Visitante sin cuenta | `visitante.spec.ts`, `privacidad.spec.ts`, `territorio.spec.ts`, `resultados.spec.ts` |
| Quien llama a los casos de uso por fuera de la pantalla | `casos.spec.ts` |

**R1–R6** (`recorridos.spec.ts`): alta → publicar necesidad → oportunidad → cotizar → adjudicar →
entregar y calificar por ambos lados, en una sola prueba y por la interfaz. Además, el seed los
ejercita con los casos de uso, como antes.

**Seed:** los 33 actores llevan ítems y oficios de la taxonomía nueva, hay perfiles en regiones de
norte a sur y algunos tienen ilustraciones generadas (sin personas).

**Migración:** sobre una copia de la base sembrada con `main`, se aplica todo dos veces y se compara
comuna y clasificación de cada perfil, publicación, necesidad y producto antes y después.

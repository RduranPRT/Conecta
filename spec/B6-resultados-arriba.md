# B6 · Resultados arriba y pantalla compacta

**Cubre:** S06

## Reglas

1. Después de buscar, título y cantidad van en una línea; territorio y categoría entendida, en otra;
   los filtros, en una fila que se desliza hacia el lado.
2. Los textos explicativos solo aparecen sin resultados.
3. En 390×844 la primera tarjeta queda dentro de la pantalla, por encima de la barra inferior.
4. No cambia el mapa ni la navegación, que Diego y Ruggero valoraron. En el celular, «Ver mapa»
   alterna la vista desde la misma fila.

## Criterio

`tests/e2e/resultados.spec.ts`: para varias búsquedas y para la navegación por área, la primera
tarjeta se ve completa sin hacer scroll.

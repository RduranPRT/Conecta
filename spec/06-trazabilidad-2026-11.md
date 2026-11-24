# 06 · Trazabilidad · cierre de noviembre 2026

Rama `feat/vitrina-taxonomia-registro`. «Hecho» significa: en la rama y con prueba en verde. Nada está
desplegado. Los nombres de archivo son de `tests/e2e` o `tests/unit`.

| Código | Solicitud | Bloque | Estado | Evidencia |
|---|---|---|---|---|
| N01 | Fotografías en el catálogo | B5 | Hecho¹ | `fotos.spec`, `imagenes.test` |
| N02 | Fotografías en los perfiles | B5 | Hecho¹ | `fotos.spec` |
| N03 | Navegación pública sin registro | B1 | Hecho | `visitante.spec`, `privacidad.spec`, `destino.test` |
| S01 | Explicar Conecta antes del registro | B1 | Hecho | `visitante.spec` |
| S02 | Explorar sin cuenta | B1 | Hecho | `visitante.spec` |
| S03 | Buscar desde la entrada | B1 | Hecho | `visitante.spec` (buscador en la mitad superior) |
| S04 | Reducir datos iniciales | B4 | Hecho | `registro.spec` (4 campos) |
| S05 | Datos según la acción | B4 | Hecho | `requisitos.test`, `registro.spec`, `casos.spec` |
| S06 | Resultados arriba | B6 | Hecho | `resultados.spec` |
| S07 | Teléfono separado | B4 | Hecho | `telefono.test`, `registro.spec` |
| S08 | Botón final claro | B4 | Hecho | `registro.spec` |
| S09 | Orientar durante el registro | B4 | Hecho | `registro.spec` |
| S10 | Orientar después de entrar | B1 | Hecho | `recorridos.spec` |
| S11 | Opción «Otro» | B3 | Hecho | `taxonomia.spec` |
| S12 | Ampliar oficios y servicios | B3 | Hecho | `taxonomia.test`, `taxonomia.spec` |
| S13 | Separar perfil y roles de lo ofrecido | B3 | Hecho | `taxonomia.test` |
| S14 | De área a necesidad | B3 | Hecho | `taxonomia.spec` (Explorar) |
| S15 | Varias actividades por perfil | B3 | Hecho | `taxonomia.spec` |
| S16 | Campos según actividad | B4 | Hecho | `registro.spec` |
| S17 | Evitar duplicados | B3 | Hecho | `taxonomia.test` |
| S18 | Nombres y ejemplos cotidianos | B3 | Hecho² | `taxonomia.test` |
| S19 | Preferencias ≠ oferta | B3 | Hecho | `casos.spec` |
| S20 | Aclarar región y cobertura | B2 | Hecho | `territorio.spec` |
| S21 | Rubro de Diego | — | Fuera | Falta su consulta exacta |
| S22 | Buscar y ofrecer en la misma cuenta | B4 | Hecho | `recorridos.spec`, `registro.spec` |
| S23 | Ofrece / Busca | B1 | Hecho | `visitante.spec` |
| S24 | Búsqueda por voz | — | Fuera | Posterior |
| S25 | Demanda real | — | Fuera | Posterior |
| C01–C05 | Taxonomía 2x3 | B3 | Hecho | `taxonomia.test`, `taxonomia.spec` |
| C06 | Adaptar la referencia | B3 | Hecho² | `taxonomia.test` |
| P01 | Todas las comunas | B2 | Hecho | `territorio.test`, `registro.spec` (Putre, Ñuñoa, Chillán, Cabo de Hornos) |
| P02 | Categorías de repuestos | B3 | Hecho | `taxonomia.spec` |
| P03 | Registro empresarial | B4 | Hecho | `registro.spec` |
| P04 | Empresas, proveedores y servicios | B3 | Hecho | `taxonomia.spec` (rol y comuna) |
| P05 | Registro de particulares | B4 | Hecho | `registro.spec` |
| P06 | Perfil con varias funciones | B4 | Hecho | `registro.spec` |
| P07 | Catálogo | B5 | Hecho¹ | `recorridos.spec`, `fotos.spec` |
| P08 | Validación integral | B7 | Hecho³ | `tests/e2e` completo |

¹ Con disco local. **R2 no se probó contra un bucket real** (no hay credenciales): el adaptador tiene
pruebas con un cliente simulado.
² La taxonomía queda en «propuesta» hasta que Álvaro la valide.
³ En Microsoft Edge con pantalla de 390×844. No se probó en un celular real ni en Safari.

## Decisiones tomadas en el camino

1. **No se adoptó `division`**; se conservan `regiones` y `comunas` (ver B2).
2. Rubro, subgrupo, ítem y oficio comparten la tabla `categorias`. Las 67 especialidades pasan a ser
   subgrupos con el mismo `id`.
3. «Publicación» con fotos = elemento de Mis productos y servicios. Los avisos del feed no cambian.
4. Los perfiles que solo compran no aparecen en Buscar ni en el mapa.
5. El visitante ve cuántas propuestas tiene una necesidad, no de quién ni por cuánto.
6. Contactos escritos en textos libres se ocultan al visitante.
7. El RUT heredado no se modifica; la versión validada vive en otra columna, con índice único.
8. El RUT no se edita desde Mi perfil una vez registrado.
9. Guardar no se ejecuta solo al volver del ingreso: una URL no debe cambiar datos.
10. Se agregó `requisitosPara('contactar')` = RUT, para que las cuentas antiguas lo completen (D6).
11. La capa de repositorios del encargo no existe en este código; se mantuvo el patrón actual.

## Puntos abiertos

- **Domicilio de personas naturales (Ley 21.719):** la dirección y el punto exacto son públicos si se
  escriben. El formulario lo advierte, es opcional y se puede quitar. A revisar con Álvaro.
- **RUT obligatorio para particulares:** vigente (D6). Reevaluar si hay abandono.
- **Taxonomía:** pendiente de validación.
- **RUT mal escrito al registrarse:** no hay pantalla para corregirlo; hoy lo cambia administración en
  la base.
- **Fase de contracción:** quitar `categoria_rubros`, `categorias.oficio` y los estados antiguos de
  solicitudes, cuando la versión nueva lleve un tiempo estable.
- **Objetos huérfanos:** si el almacenamiento falla al borrar, queda el evento
  `imagen.objeto_huerfano` con la clave. No hay tarea que los reintente (pg-boss no está configurado).
- **`railway.json`:** deja de leerse el 1-dic-2026 (ver `docs/despliegue-2026-11.md`).

# B3 · Taxonomía: separar quién es de qué ofrece

**Cubre:** C01–C06 · S11 · S12 · S13 · S14 · S15 · S17 · S18 · S19 · P02 · P04

## Modelo

| Concepto | Dónde vive |
|---|---|
| Actor | `perfiles` + `tipo_identidad` + RUT |
| Rol | `perfil_roles` (Comprador, Prestador de servicios, Comercio, Proveedor a negocios, Productor, Partner) |
| Rubro → Subgrupo → Ítem / Oficio | `categorias.nivel` (`rubro`, `subgrupo`, `item`, `oficio`) |
| Un elemento en varios lugares | `categoria_padres` (N:M, un padre principal) |
| Lo que ofrece | `perfil_categorias` (ítems, oficios o subgrupos completos) |
| Lo que le interesa | `perfil_intereses` (solo rubros) |
| «Otro» | `solicitudes_categoria` |

Todos los niveles comparten la tabla `categorias`: así `perfil_categorias`, `necesidades`,
`publicaciones` e `items` siguen apuntando al mismo `id` y la búsqueda no se duplica. Las 67
especialidades de octubre **pasan a ser subgrupos con el mismo `id` y `slug`**, y por eso ningún
perfil, publicación o necesidad cambia de clasificación.

`items` (catálogo de un perfil) no es lo mismo que un ítem de la taxonomía: «Marraqueta a $2.800 de
Panadería Rosa» es del catálogo; «Marraqueta» es de la taxonomía.

## Migración (expandir y contraer)

- **Expandir:** `nivel`, `origen`, `categoria_padres` (se llena desde `padre_id` y
  `categoria_rubros`), `perfil_intereses`, rol `partner` y estados nuevos de solicitud.
- **Se conserva** `padre_id`, `oficio` y `categoria_rubros`: el código anterior sigue funcionando
  durante el despliegue. **Contraer** (otra entrega): quitar `categoria_rubros` y `oficio`.
- Los estados `asignada`/`descartada` pasan a `fusionada`/`rechazada` en `db:catalogos`.

## Reglas

1. **Identidad única (C02):** el `slug` de un ítem sale de su nombre normalizado y es único. Un
   segundo ítem con el mismo nombre no se puede crear, ni por semilla ni desde administración.
2. **Qué cubre una búsqueda** (`coberturaDe`):
   - rubro → sus subgrupos y todo lo que cuelga de ellos;
   - subgrupo → él, sus ítems y sus oficios;
   - ítem → él (exacto) y, con menos peso, quien declaró el subgrupo completo o un oficio de ese
     subgrupo;
   - oficio → él (exacto) y, con menos peso, sus subgrupos y los ítems de servicio de ellos.
3. **El oficio nunca es obligatorio** para vender productos.
4. **«Otro» (S11):** el texto se guarda, el perfil se completa y el texto es buscable. Estados:
   pendiente → aprobada (crea el ítem) · fusionada (usa uno existente) · rechazada. Aprobar o
   fusionar agrega el ítem al perfil y resuelve de una vez todas las pendientes con el mismo texto.
5. **Intereses ≠ oferta (S19):** los intereses solo ordenan el feed y las destacadas. No limitan
   búsquedas ni generan oportunidades.
6. **«No existe» ≠ «no hay oferta» (S12):** si se reconoce la categoría y no hay actores, se dice y
   se ofrece publicar la necesidad. Si no se reconoce, se sugieren las más parecidas.
7. La semilla (`scripts/seed/taxonomia.ts`) es la fuente de verdad. `npm run taxonomia:exportar`
   genera `docs/taxonomia-para-revision.md`. Lo creado desde administración (`origen = admin`) no lo
   toca el cargador.

## Estado de la taxonomía

**Propuesta**, hasta que Álvaro la valide. El código no depende de ningún contenido: solo de niveles
y relaciones.

## Criterios de aceptación

| Criterio | Prueba |
|---|---|
| Abogado con «Asesoría en contratos»: por «abogado», «contrato» y Empresa y legal | `tests/e2e/taxonomia.spec.ts` |
| Electricista con varias reparaciones en un solo perfil | ídem |
| Panadería sin oficio: por «pan» y «marraqueta» | ídem |
| Audiovisual con fotografía, video y dron | ídem |
| Tienda de repuestos: rubro, producto, rol y comuna | ídem |
| «Otro» → cola → aprobar → perfil bajo el ítem nuevo | ídem |
| Sin ítems duplicados | `tests/unit/taxonomia.test.ts` |

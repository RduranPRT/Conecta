# B1 · Navegación pública sin registro

**Cubre:** N03 · S01 · S02 · S03 · S10 · S23

## Reglas

1. `/` es **Inicio** con y sin sesión, dentro del mismo marco de tres accesos (Inicio · Mapa · Mi
   Conecta). `/inicio` redirige a `/` para no romper enlaces antiguos.
2. Rutas públicas: `/`, `/buscar`, `/explorar`, `/explorar/[rubro]`, `/descubrir`, `/mapa`,
   `/p/[slug]`, `/p/[slug]/catalogo/[id]`, `/publicaciones/[id]`, `/necesidades/[id]`. El resto
   pide sesión con `requerirPerfil`.
3. **Privacidad en el servidor.** Los casos públicos devuelven un DTO con columnas explícitas
   (`PerfilPublico`, `PublicacionPublica`); ninguna consulta pública selecciona `telefono`,
   `correo_publico`, `sitio_web`, `redes`, `identificador_fiscal` ni `usuario_id`.
4. El contacto se pide aparte: `contactoDe({ perfilId, solicitantePerfilId })`, expuesto por la
   server action `accionVerContacto`, que exige sesión y registra `contacto.consultado`.
5. **Textos libres:** para el visitante, teléfonos, correos, enlaces y cuentas de redes escritos a
   mano se reemplazan por «[inicia sesión para ver el contacto]» (`ocultarContacto`).
6. **Necesidades:** el visitante ve título, descripción, territorio y cantidad de propuestas. No ve
   montos, autores de propuestas ni traza.
7. **Acciones con cuenta** (Contactar, Solicitar, Cotizar, Enviar propuesta, Guardar, Responder,
   Publicar, Me interesa): el visitante ve «Inicia sesión o crea tu cuenta para continuar» con dos
   botones. Sin JavaScript, el enlace lleva a `/ingresar?next=…`, que muestra el mismo aviso.
8. **Retorno:** `next` conserva ruta, filtros y acción (`?accion=contactar`). `destinoSeguro` solo
   acepta rutas internas relativas; cualquier otra cosa lleva a `/`.
9. «¿Qué es Conecta?» aparece solo sin sesión, bajo el buscador, y es compacto.
10. «Ofrece» / «Busca» en todas las tarjetas de publicación y en el detalle.

## Decisiones

- `guardar` no se ejecuta solo al volver: una URL no debe cambiar datos. Se vuelve al mismo punto de
  la lista y el botón queda disponible.
- Los perfiles que solo compran no aparecen en Buscar ni en el mapa: no ofrecen nada y su ubicación
  sería su casa.

## Criterios de aceptación

| Dado / Cuando / Entonces | Prueba |
|---|---|
| Visitante busca «electricista», abre un perfil, su catálogo y el mapa, sin cuenta | `tests/e2e/visitante.spec.ts` |
| El HTML/RSC de esas páginas no trae teléfono, correo, WhatsApp, web ni redes | `tests/e2e/privacidad.spec.ts` |
| «Contactar» pide sesión y vuelve al mismo perfil con el contacto disponible | `tests/e2e/visitante.spec.ts` |
| `next=https://externo.com` termina en Inicio | `tests/unit/destino.test.ts` + e2e |
| «¿Qué es Conecta?» solo sin sesión; buscador visible sin scroll a 390×844 | `tests/e2e/visitante.spec.ts` |

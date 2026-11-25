# B4 · Registro y perfil progresivos

**Cubre:** S04 · S05 · S07 · S08 · S09 · S16 · S22 · P03 · P05 · P06 · D6

## Alta mínima

`/registro` pide **nombre, correo, contraseña y RUT**, cada uno con una línea que dice para qué. Al
enviar se crean la cuenta y el perfil en el mismo paso, como Comprador. `tipo_identidad` se deduce
del RUT (desde 50.000.000, empresa). No hay ningún campo empresarial.

- Con una acción pendiente (`next`), se vuelve directo a ella con «Tu cuenta está lista».
- Sin acción pendiente, sigue `/bienvenida`: confirma «Tu cuenta está lista» y hace **una pregunta
  opcional**, «¿Qué quieres hacer?» (Buscar · Ofrecer · Ambas), que se puede saltar. Son las
  preguntas iniciales que Belén valoró, reubicadas. Ahí también se puede subir una foto (B5).
- `/onboarding` queda solo para cuentas a medio crear (con sesión y sin perfil): pide nombre y RUT.

## RUT

- `src/lib/rut.ts`: módulo 11, formato `12.345.678-5`, normalizado `12345678-5`.
- Columna nueva `identificador_fiscal_norm` con índice único. Se llena en el alta y, para las cuentas
  existentes, con `db:catalogos`: solo si es válido y no se repite. **Los datos originales no se
  tocan.**
- Es único entre perfiles. Una vez registrado no se edita desde Mi perfil.
- **Cuentas sin RUT:** ven un aviso para completarlo, que se puede cerrar y no bloquea la navegación.
  Se exige al intentar una acción.

## Datos por acción

`requisitosPara(accion, perfil)` en `casos/requisitos.ts` es la única regla. La usan las pantallas
(para pedir lo que falta en el momento) y los casos de uso (para exigirlo):

| Acción | Pide si falta |
|---|---|
| `buscar`, `ver`, `guardar` | nada |
| `contactar` | RUT (solo cuentas antiguas) |
| `publicar_necesidad` | RUT · comuna |
| `ofrecer`, `enviar_propuesta`, `publicar_catalogo`, `publicar_oferta` | RUT · comuna · al menos una actividad · teléfono |
| `solicitar_verificacion` | RUT |

Cada requisito trae su motivo. `<CompletarDatos>` muestra **solo** los campos que faltan, dice para
qué, y guarda con `completarDatos`, que aplica las mismas reglas. Después se sigue en la misma
pantalla. Completar lo de «Ofrecer» activa el rol que corresponda a las actividades elegidas.

## Campos según la actividad (S16)

| Quién | Ve |
|---|---|
| Particular que solo busca | nombre, foto, comuna (opcional), teléfono (opcional), intereses |
| Presta servicios | además: actividades de servicio y oficios, radio a domicilio, descripción, contacto público, dirección, cobertura |
| Vende productos | además: productos, descripción, contacto público, dirección, cobertura. Sin oficio ni radio |

## Teléfono (S07)

El `+56` es texto fijo, fuera del campo. Se escribe el número con `inputmode="tel"`, ejemplo
«9 1234 5678», y se validan **9 dígitos**. Si alguien pega «+56 9…», no se duplica.

## Dirección pública

El campo dice que es opcional y que **se verá públicamente**. Punto abierto con Álvaro (Ley 21.719).

## Criterios de aceptación

| Criterio | Prueba |
|---|---|
| Particular: 4 campos, busca «técnico de calefones» y lo contacta sin campos empresariales | `tests/e2e/registro.spec.ts` |
| Técnico: al ofrecer se le pide solo comuna, actividad y teléfono | ídem |
| Empresa de repuestos: completa, accede y edita sin bloqueos | ídem |
| RUT inválido o duplicado se rechaza con mensaje claro | `tests/unit/rut.test.ts` + e2e |
| 390×844: teléfono sin tocar el +56 y botón final visible sin scroll | ídem |

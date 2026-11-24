/**
 * Teléfonos. El prefijo del país viaja separado del número (pedido de la
 * prueba de usuario del 08-oct: escribir y corregir «+56» con el cursor era
 * difícil). Se guarda en formato E.164 (`+56912345678`) para que cualquier
 * país funcione igual; la interfaz lo muestra agrupado.
 */

/** Une prefijo y número escrito a mano. Devuelve null si no hay dígitos útiles. */
export function normalizarTelefono(prefijo: string, numero: string): string | null {
  const codigo = prefijo.replace(/\D/g, "");
  let digitos = numero.replace(/\D/g, "");
  if (!digitos) return null;

  // Si la persona igual escribió el prefijo («56 9 1234 5678»), no se duplica.
  if (codigo && digitos.startsWith(codigo) && digitos.length > 9) {
    digitos = digitos.slice(codigo.length);
  }
  // El cero de larga distancia nacional no va en el formato internacional.
  digitos = digitos.replace(/^0+/, "");

  // En Chile, celulares y fijos tienen 9 dígitos (S07).
  if (codigo === "56" && digitos.length !== 9) {
    throw new Error(
      `El teléfono debe tener 9 dígitos, sin el +56, y escribiste ${digitos.length}. Ejemplo: 9 1234 5678.`,
    );
  }
  if (digitos.length < 6 || digitos.length > 12) {
    throw new Error("El teléfono no parece completo. Revisa los dígitos.");
  }
  return `+${codigo}${digitos}`;
}

/** Separa un teléfono guardado en prefijo y número local, para editarlo. */
export function separarTelefono(
  telefono: string | null | undefined,
  prefijoPorDefecto = "+56",
): { prefijo: string; numero: string } {
  if (!telefono) return { prefijo: prefijoPorDefecto, numero: "" };
  const limpio = telefono.replace(/[^\d+]/g, "");
  const codigo = prefijoPorDefecto.replace(/\D/g, "");
  if (limpio.startsWith(`+${codigo}`)) {
    return { prefijo: prefijoPorDefecto, numero: limpio.slice(codigo.length + 1) };
  }
  return { prefijo: prefijoPorDefecto, numero: limpio.replace(/^\+/, "") };
}

/** «+56912345678» → «+56 9 1234 5678». Los formatos que no reconoce quedan igual. */
export function formatearTelefono(telefono: string | null | undefined) {
  if (!telefono) return "";
  const m = telefono.replace(/[^\d+]/g, "").match(/^\+56(9)(\d{4})(\d{4})$/);
  return m ? `+56 ${m[1]} ${m[2]} ${m[3]}` : telefono;
}

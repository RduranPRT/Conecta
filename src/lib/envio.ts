import { startTransition, type FormEvent } from "react";

/**
 * Envía un formulario sin que React lo vacíe al terminar. Con `action`, React
 * reinicia los campos aunque haya un error: quien completó su perfil en el
 * celular perdía todo lo escrito (P03). Se deja `action` en el formulario para
 * que siga funcionando sin JavaScript.
 */
export function sinReiniciar(enviar: (datos: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const boton = (e.nativeEvent as SubmitEvent).submitter;
    const datos = new FormData(e.currentTarget, boton);
    startTransition(() => enviar(datos));
  };
}

import { permanentRedirect } from "next/navigation";

/** Inicio vive en «/», con y sin sesión. Esta ruta queda por los enlaces antiguos. */
export default function PaginaInicioAnterior() {
  permanentRedirect("/");
}

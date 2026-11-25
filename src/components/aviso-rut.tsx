"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

const CLAVE = "conecta:aviso-rut";

/**
 * Cuentas creadas antes de pedir el RUT: se les recuerda al ingresar, sin
 * bloquear nada. Al cerrarlo no vuelve a aparecer en esta visita.
 */
export function AvisoRut() {
  const pathname = usePathname();
  const consulta = useSearchParams().toString();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(sessionStorage.getItem(CLAVE) !== "cerrado");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible || pathname === "/completar") return null;
  const next = `${pathname}${consulta ? `?${consulta}` : ""}`;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-alerta/30 bg-alerta/10 px-4 py-2.5 text-sm text-texto">
      <span className="flex-1">
        Falta tu RUT. Te lo pediremos cuando quieras contactar, publicar o cotizar.{" "}
        <Link
          href={`/completar?accion=contactar&next=${encodeURIComponent(next)}`}
          className="font-medium text-marca hover:underline"
        >
          Completarlo ahora
        </Link>
      </span>
      <button
        type="button"
        aria-label="Cerrar aviso"
        onClick={() => {
          setVisible(false);
          try {
            sessionStorage.setItem(CLAVE, "cerrado");
          } catch {
            // Sin almacenamiento (modo privado) solo se oculta en esta pantalla.
          }
        }}
        className="text-tenue"
      >
        <X size={16} />
      </button>
    </div>
  );
}

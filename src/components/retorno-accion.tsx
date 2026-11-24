"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

/**
 * Cierra el retorno a la acción: confirma el alta cuando la persona vuelve
 * directo a lo que estaba haciendo (S08, `cuenta=lista`) y la deja en la misma
 * tarjeta de la lista (`ir=pub-9`; el ancla se pierde en la redirección del
 * servidor). Limpia la URL para que recargar o compartir no lo repita.
 */
export function RetornoAccion() {
  const parametros = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  const lista = parametros.get("cuenta") === "lista";
  const ir = parametros.get("ir");

  useEffect(() => {
    if (!lista && !ir) return;
    if (lista) setVisible(true);
    if (ir) document.getElementById(ir)?.scrollIntoView({ block: "center" });
    const p = new URLSearchParams(parametros.toString());
    p.delete("cuenta");
    p.delete("ir");
    const consulta = p.toString();
    router.replace(`${pathname}${consulta ? `?${consulta}` : ""}`, { scroll: false });
  }, [lista, ir, parametros, pathname, router]);

  if (!visible) return null;
  return (
    <div
      role="status"
      className="mb-4 flex items-center gap-3 rounded-xl border border-exito/30 bg-exito/10 px-4 py-3 text-sm text-exito"
    >
      <CheckCircle2 size={18} className="shrink-0" aria-hidden />
      <span className="flex-1">
        <strong>Tu cuenta está lista.</strong> Sigue con lo que estabas haciendo.
      </span>
      <button type="button" aria-label="Cerrar aviso" onClick={() => setVisible(false)}>
        <X size={16} />
      </button>
    </div>
  );
}

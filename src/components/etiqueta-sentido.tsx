import { sentidoDe } from "@/lib/publicaciones";
import { cn } from "@/lib/utils";

/** «Ofrece» o «Busca», dicho en una palabra (S23). */
export function EtiquetaSentido({ tipo, className }: { tipo: string; className?: string }) {
  const sentido = sentidoDe(tipo);
  if (!sentido) return null;
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-superficie",
        sentido === "Busca" ? "bg-acento" : "bg-marca",
        className,
      )}
    >
      {sentido}
    </span>
  );
}

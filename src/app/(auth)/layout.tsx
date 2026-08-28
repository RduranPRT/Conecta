import Link from "next/link";

import { Marca } from "@/components/encabezado-app";

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-borde bg-superficie">
        <div className="contenedor flex h-16 items-center justify-between">
          <Marca />
          <Link href="/" className="text-xs text-tenue hover:text-texto">
            Volver al inicio
          </Link>
        </div>
      </header>
      <main className="contenedor flex flex-1 items-start justify-center py-10 sm:py-16">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}

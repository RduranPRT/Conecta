import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/* ── Botón ─────────────────────────────────────────────────────────────── */

const boton = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition " +
    "disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap",
  {
    variants: {
      variante: {
        primario: "bg-marca text-white hover:bg-marca-fuerte shadow-sm",
        secundario: "border border-borde bg-superficie text-texto hover:bg-superficie2",
        suave: "bg-marca/10 text-marca hover:bg-marca/15",
        fantasma: "text-tenue hover:bg-superficie2 hover:text-texto",
        peligro: "border border-peligro/30 bg-peligro/10 text-peligro hover:bg-peligro/15",
      },
      tamano: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icono: "h-9 w-9",
      },
    },
    defaultVariants: { variante: "primario", tamano: "md" },
  },
);

type BotonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof boton>;

export function Boton({ className, variante, tamano, ...props }: BotonProps) {
  return <button className={cn(boton({ variante, tamano }), className)} {...props} />;
}

type BotonEnlaceProps = React.ComponentProps<typeof Link> & VariantProps<typeof boton>;

export function BotonEnlace({ className, variante, tamano, ...props }: BotonEnlaceProps) {
  return <Link className={cn(boton({ variante, tamano }), className)} {...props} />;
}

/* ── Tarjeta ───────────────────────────────────────────────────────────── */

export function Tarjeta({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("tarjeta", className)} {...props} />;
}

export function TarjetaCuerpo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

/* ── Insignia ──────────────────────────────────────────────────────────── */

const insignia = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tono: {
        neutro: "bg-superficie2 text-tenue",
        marca: "bg-marca/10 text-marca",
        exito: "bg-exito/10 text-exito",
        alerta: "bg-alerta/10 text-alerta",
        peligro: "bg-peligro/10 text-peligro",
        acento: "bg-acento/10 text-acento",
        contorno: "border border-borde text-tenue",
      },
    },
    defaultVariants: { tono: "neutro" },
  },
);

export function Insignia({
  className,
  tono,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof insignia>) {
  return <span className={cn(insignia({ tono }), className)} {...props} />;
}

/* ── Avatar ────────────────────────────────────────────────────────────── */

export function Avatar({
  nombre,
  url,
  tamano = 40,
  className,
}: {
  nombre: string;
  url?: string | null;
  tamano?: number;
  className?: string;
}) {
  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={nombre}
        width={tamano}
        height={tamano}
        className={cn("rounded-full object-cover", className)}
        style={{ width: tamano, height: tamano }}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-marca/10 font-semibold text-marca",
        className,
      )}
      style={{ width: tamano, height: tamano, fontSize: tamano * 0.36 }}
      aria-hidden
    >
      {iniciales || "?"}
    </div>
  );
}

/* ── Estado vacío ──────────────────────────────────────────────────────── */

export function Vacio({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="tarjeta flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-base font-medium text-texto">{titulo}</p>
      {descripcion ? <p className="max-w-md text-sm text-tenue">{descripcion}</p> : null}
      {children}
    </div>
  );
}

/* ── Encabezado de página ──────────────────────────────────────────────── */

export function Encabezado({
  titulo,
  bajada,
  acciones,
}: {
  titulo: string;
  bajada?: React.ReactNode;
  acciones?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-texto sm:text-[1.75rem]">{titulo}</h1>
        {bajada ? <p className="mt-1 max-w-2xl text-sm text-tenue">{bajada}</p> : null}
      </div>
      {acciones ? <div className="flex items-center gap-2">{acciones}</div> : null}
    </div>
  );
}

/* ── Aviso ─────────────────────────────────────────────────────────────── */

export function Aviso({
  tono = "neutro",
  children,
}: {
  tono?: "neutro" | "marca" | "alerta" | "peligro" | "exito";
  children: React.ReactNode;
}) {
  const tonos = {
    neutro: "border-borde bg-superficie2 text-tenue",
    marca: "border-marca/25 bg-marca/10 text-marca",
    alerta: "border-alerta/30 bg-alerta/10 text-alerta",
    peligro: "border-peligro/30 bg-peligro/10 text-peligro",
    exito: "border-exito/30 bg-exito/10 text-exito",
  } as const;

  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", tonos[tono])}>{children}</div>
  );
}

/* ── Estrellas ─────────────────────────────────────────────────────────── */

export function Estrellas({ valor, conteo }: { valor: string | number | null; conteo: number }) {
  if (!valor || conteo === 0) {
    return <span className="text-xs text-tenue">Sin calificaciones</span>;
  }
  const n = typeof valor === "string" ? Number(valor) : valor;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-texto">
      <span className="text-alerta" aria-hidden>
        ★
      </span>
      <span className="font-medium">{n.toFixed(1).replace(".", ",")}</span>
      <span className="text-tenue">({conteo})</span>
    </span>
  );
}

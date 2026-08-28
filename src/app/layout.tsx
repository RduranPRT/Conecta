import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Conecta · el ecosistema de tu territorio",
    template: "%s · Conecta",
  },
  description:
    "Busca lo que necesitas, descubre lo que existe alrededor y concreta la operación " +
    "con negocios, prestadores, proveedores y productores de tu comuna.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#080c14" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}

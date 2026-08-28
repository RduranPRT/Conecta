import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        borde: "rgb(var(--borde) / <alpha-value>)",
        fondo: "rgb(var(--fondo) / <alpha-value>)",
        superficie: "rgb(var(--superficie) / <alpha-value>)",
        superficie2: "rgb(var(--superficie-2) / <alpha-value>)",
        texto: "rgb(var(--texto) / <alpha-value>)",
        tenue: "rgb(var(--tenue) / <alpha-value>)",
        marca: {
          DEFAULT: "rgb(var(--marca) / <alpha-value>)",
          suave: "rgb(var(--marca-suave) / <alpha-value>)",
          fuerte: "rgb(var(--marca-fuerte) / <alpha-value>)",
        },
        acento: "rgb(var(--acento) / <alpha-value>)",
        exito: "rgb(var(--exito) / <alpha-value>)",
        alerta: "rgb(var(--alerta) / <alpha-value>)",
        peligro: "rgb(var(--peligro) / <alpha-value>)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      fontFamily: {
        sans: ["var(--fuente-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        tarjeta: "0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px -12px rgb(15 23 42 / 0.12)",
        flotante: "0 12px 40px -12px rgb(15 23 42 / 0.28)",
      },
      keyframes: {
        aparecer: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        aparecer: "aparecer 200ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;

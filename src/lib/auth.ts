import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import * as authSchema from "@/db/auth-schema";

const secreto = process.env.BETTER_AUTH_SECRET;

// Aviso, no excepción: si esto reventara al importarse, tumbaría el `next build`
// en cualquier imagen que compile sin las variables de ejecución cargadas.
if (!secreto && process.env.NODE_ENV === "production") {
  console.error(
    "[Conecta] Falta BETTER_AUTH_SECRET. Genera uno con `openssl rand -base64 32` " +
      "y cárgalo en las variables del servicio: sin él, las sesiones no son seguras.",
  );
}

export const auth = betterAuth({
  appName: "Conecta",
  secret: secreto ?? "secreto-solo-para-desarrollo-local-no-usar-en-produccion",
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    ...(process.env.RAILWAY_PUBLIC_DOMAIN ? [`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`] : []),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: authSchema.user,
      session: authSchema.session,
      account: authSchema.account,
      verification: authSchema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    // El MVP no envía correos todavía: la verificación queda para el día que
    // Resend esté configurado (RESEND_API_KEY).
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  plugins: [nextCookies()],
});

export type Sesion = typeof auth.$Infer.Session;

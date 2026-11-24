import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Railway construye la imagen y ejecuta `next start`; no hace falta output standalone.
  reactStrictMode: true,
  // Binarios nativos: no se empaquetan.
  serverExternalPackages: ["sharp", "@aws-sdk/client-s3"],
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Las fotos admiten 5 MB; el margen deja que una de 6 MB llegue al servidor y
    // reciba un mensaje claro en vez de un error de red.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;

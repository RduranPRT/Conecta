import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Railway construye la imagen y ejecuta `next start`; no hace falta output standalone.
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Las server actions reciben adjuntos de hasta 5 MB en el prototipo.
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;

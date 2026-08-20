import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Vercel deployment
  output: "standalone",
  // El repo aún no tiene flat config de ESLint 9: no tumbar el build por lint.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

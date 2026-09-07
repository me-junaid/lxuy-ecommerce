import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const rawApiHost = isProd 
  ? (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001")
  : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001");

// Normalize: remove trailing slash and trailing /api to prevent /api/api/:path* in rewrites
const apiHost = rawApiHost.trim().replace(/\/+$/, "").replace(/\/api$/, "");

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiHost}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
import type { NextConfig } from "next";

const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

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
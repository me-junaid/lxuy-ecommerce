import type { NextConfig } from "next";

function getCleanApiHost(raw?: string): string | null {
  if (!raw) return null;
  let val = raw.trim().replace(/^["']|["']$/g, "").trim();
  if (!val) return null;

  // If provided domain without protocol (e.g. your-app.up.railway.app), prepend https://
  if (
    !val.startsWith("http://") &&
    !val.startsWith("https://") &&
    !val.startsWith("/")
  ) {
    val = `https://${val}`;
  }

  // Remove trailing slashes and trailing /api to avoid duplicate /api/api in destination
  val = val.replace(/\/+$/, "").replace(/\/api$/, "");

  if (!val || val === "http://" || val === "https://") {
    return null;
  }

  return val;
}

const rawApiHost =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:3001");
const apiHost = getCleanApiHost(rawApiHost);

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui"],
  async rewrites() {
    if (!apiHost) {
      return [];
    }

    const destination = `${apiHost}/api/:path*`;
    if (
      !destination.startsWith("http://") &&
      !destination.startsWith("https://") &&
      !destination.startsWith("/")
    ) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination,
      },
    ];
  },
};

export default nextConfig;
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Proxy all /api/* requests to Django backend
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
      // Proxy auth routes for CSRF / session cookie flow
      {
        source: "/auth-backend/:path*",
        destination: "http://localhost:8000/auth/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
    ],
  },
};

export default nextConfig;

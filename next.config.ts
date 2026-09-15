import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV !== "production"
    ? {
        allowedDevOrigins: [
          "192.168.30.196",
          "192.168.30.119",
          "192.168.30.118",
        ],
      }
    : {}),
};

export default nextConfig;

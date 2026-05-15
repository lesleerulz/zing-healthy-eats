import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/static/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5000",
        pathname: "/static/**",
      },
      {
        protocol: "https",
        hostname: "zinghealthyeats.com",
        pathname: "/static/**",
      },
      {
        protocol: "https",
        hostname: "api.zinghealthyeats.com",
        pathname: "/static/**",
      },
    ],
  },
};

export default nextConfig;

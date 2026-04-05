import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**",
      },
      // Add your production backend domain here when deploying, e.g.:
      // { protocol: "https", hostname: "api.yourdomain.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;

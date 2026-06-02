import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "arweave.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.solana.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

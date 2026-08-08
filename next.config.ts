import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["0.0.0.0","192.168.100.13","255.255.255.255","151.234.194.130"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

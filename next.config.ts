import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["0.0.0.0","192.168.100.13","192.168.100.1","255.255.255.255","151.234.194.130","127.0.0.1","2.182.123.176","mozemehraban.ir","www.mozemehraban.ir"],
  experimental: {
    serverActions: {
      // آپلود چند تصویر محصول (هر تصویر حداکثر ۵ مگابایت) از پنل مدیریت
      bodySizeLimit: "25mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "dkstatics-public.digikala.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

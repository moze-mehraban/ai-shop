import { getSiteUrl } from "@/lib/siteUrl";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/profile", "/cart", "/checkout", "/login", "/search"],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}

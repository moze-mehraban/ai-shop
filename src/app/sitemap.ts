import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/siteUrl";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { id: true, updatedAt: true } }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...categories.map((category) => ({
      url: `${base}/category/${encodeURIComponent(category.slug)}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${base}/product/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...["about", "contact", "terms", "privacy", "returns"].map((path) => ({
      url: `${base}/${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];
}

import { getCategoryTree } from "@/lib/categories";
import { getDiscountedPrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { normalizeSearchText, searchProducts } from "@/lib/search";

export const dynamic = "force-dynamic";

// پیشنهادهای زنده جستجو برای باکس جستجوی هدر
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";

  if (normalizeSearchText(query).length < 2) {
    return Response.json({ products: [], categories: [], total: 0, approximate: false });
  }

  const [{ ids, approximate }, { nodes }] = await Promise.all([searchProducts(query), getCategoryTree()]);
  const topIds = ids.slice(0, 6);
  const products = topIds.length
    ? await prisma.product.findMany({
        where: { id: { in: topIds } },
        select: { id: true, title: true, imageUrl: true, price: true, discountPercent: true, stock: true },
      })
    : [];

  const normalized = normalizeSearchText(query);
  const categories = [...nodes.values()]
    .filter((category) => normalizeSearchText(category.name).includes(normalized))
    .slice(0, 4)
    .map((category) => ({ name: category.name, slug: category.slug }));

  return Response.json({
    products: products
      .sort((a, b) => topIds.indexOf(a.id) - topIds.indexOf(b.id))
      .map((product) => ({
        id: product.id,
        title: product.title,
        imageUrl: product.imageUrl,
        price: getDiscountedPrice(product.price, product.discountPercent),
        inStock: product.stock > 0,
      })),
    categories,
    total: ids.length,
    approximate,
  });
}

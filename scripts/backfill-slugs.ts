/**
 * ساخت آدرس خوانا برای محصولاتی که هنوز ندارند (یک‌بار؛ اجرای دوباره امن است).
 * اجرا: npx tsx scripts/backfill-slugs.ts
 */
import { PrismaClient } from "@prisma/client";
import { makeSlug, uniqueSlug } from "../src/lib/slug";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({ where: { slug: null }, select: { id: true, title: true }, orderBy: { createdAt: "asc" } });
  for (const product of products) {
    const slug = await uniqueSlug(makeSlug(product.title), async (candidate) =>
      Boolean(await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } })),
    );
    await prisma.product.update({ where: { id: product.id }, data: { slug } });
  }
  console.log(`Slugs created for ${products.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

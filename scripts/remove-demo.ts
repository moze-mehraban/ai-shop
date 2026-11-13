/**
 * حذف همه داده‌های نمونه (هر رکوردی که شناسه‌اش با demo_ شروع می‌شود) و تصاویر آن‌ها.
 * اجرا: npm run demo:remove
 * محصول نمونه‌ای که در سفارش یک مشتری واقعی آمده باشد حذف نمی‌شود، فقط غیرفعال می‌شود.
 */
import { PrismaClient } from "@prisma/client";
import { unlink } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();
const demo = { startsWith: "demo_" };

async function main() {
  await prisma.orderItem.deleteMany({ where: { order: { id: demo } } });
  const orders = await prisma.order.deleteMany({ where: { id: demo } });
  const reviews = await prisma.review.deleteMany({ where: { OR: [{ id: demo }, { userId: demo }] } });

  const products = await prisma.product.findMany({
    where: { id: demo },
    include: { images: true, _count: { select: { orderItems: true } } },
  });
  const removable = products.filter((product) => product._count.orderItems === 0);
  const kept = products.filter((product) => product._count.orderItems > 0);

  const files = removable.flatMap((product) => [product.imageUrl, ...product.images.map((image) => image.url)]);
  await prisma.product.deleteMany({ where: { id: { in: removable.map((product) => product.id) } } });
  if (kept.length) {
    await prisma.product.updateMany({ where: { id: { in: kept.map((product) => product.id) } }, data: { isActive: false } });
  }

  for (const url of files) {
    if (url?.startsWith("/uploads/")) {
      await unlink(path.join(process.cwd(), "uploads", path.basename(url))).catch(() => undefined);
    }
  }

  // زیرمجموعه‌ها قبل از والدها؛ دسته‌ای که هنوز محصول دارد باقی می‌ماند
  let categories = 0;
  for (let pass = 0; pass < 3; pass++) {
    const candidates = await prisma.category.findMany({
      where: { id: demo },
      include: { _count: { select: { products: true, children: true } } },
    });
    for (const category of candidates) {
      if (category._count.products === 0 && category._count.children === 0) {
        await prisma.category.delete({ where: { id: category.id } });
        categories += 1;
      }
    }
  }

  const users = await prisma.user.deleteMany({ where: { id: demo } });

  console.log(
    `Removed: ${orders.count} orders, ${reviews.count} reviews, ${removable.length} products, ${categories} categories, ${users.count} users.` +
      (kept.length ? ` ${kept.length} demo products were in real orders and were deactivated instead.` : ""),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

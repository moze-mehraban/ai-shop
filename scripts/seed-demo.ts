/**
 * افزودن داده‌های نمونه (دسته‌بندی، محصول، تصویر، دیدگاه و سفارش) به فروشگاه.
 * اجرا:   npm run demo:seed
 * حذف:    npm run demo:remove
 * اجرای دوباره امن است؛ مواردی که قبلاً ساخته شده‌اند رد می‌شوند.
 */
import { PrismaClient } from "@prisma/client";
import {
  BatteryCharging, Cable, Headphones, Headset, Keyboard, Laptop, Mouse,
  PlugZap, Shield, Smartphone, Speaker, Tablet, Watch,
} from "lucide-react";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import {
  DEMO_CATEGORIES, DEMO_ORDERS, DEMO_PRODUCTS, DEMO_REVIEWS, DEMO_USERS,
  type DemoIcon,
} from "./demo-data";

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const ICONS: Record<DemoIcon, typeof Smartphone> = {
  smartphone: Smartphone, tablet: Tablet, laptop: Laptop, watch: Watch,
  headphones: Headphones, headset: Headset, "plug-zap": PlugZap, cable: Cable,
  "battery-charging": BatteryCharging, shield: Shield, speaker: Speaker,
  mouse: Mouse, keyboard: Keyboard,
};

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// تصویر محصول: آیکن نوع کالا به رنگ محصول روی زمینه روشن (۸۰۰×۸۰۰ webp)
async function makeImage(icon: DemoIcon, color: string, brand: string) {
  const light = luminance(color) > 0.8;
  const stroke = light ? "#64748b" : color;
  const iconSvg = renderToStaticMarkup(
    createElement(ICONS[icon], { size: 380, color: stroke, strokeWidth: 1.1, fill: light ? "#f1f5f9" : color, fillOpacity: light ? 1 : 0.12 }),
  ).replace("<svg ", '<svg x="210" y="190" ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <rect width="800" height="800" fill="#ffffff"/>
    <circle cx="400" cy="380" r="300" fill="${light ? "#e2e8f0" : color}" fill-opacity="${light ? 0.6 : 0.1}"/>
    ${iconSvg}
    <text x="400" y="720" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700" fill="#94a3b8" letter-spacing="6">${brand.toUpperCase()}</text>
  </svg>`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}.webp`;
  await sharp(Buffer.from(svg)).webp({ quality: 88 }).toFile(path.join(UPLOAD_DIR, name));
  return `/uploads/${name}`;
}

async function main() {
  // ---------- دسته‌بندی‌های والد موجود ----------
  const parents = new Map<string, string>();
  for (const [slug, name, sortOrder] of [["digital", "موبایل و کالای دیجیتال", 0], ["accessories", "لوازم جانبی", 1]] as const) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    const category = existing ?? (await prisma.category.create({ data: { id: `demo_cat_${slug}`, name, slug, sortOrder } }));
    parents.set(slug, category.id);
  }
  const mobile =
    (await prisma.category.findUnique({ where: { slug: "mobile" } })) ??
    (await prisma.category.create({
      data: { id: "demo_cat_mobile", name: "تلفن همراه", slug: "mobile", parentId: parents.get("digital"), sortOrder: 1 },
    }));

  // ---------- زیرمجموعه‌ها ----------
  const categoryIds = new Map<string, string>([["mobile", mobile.id]]);
  let createdCategories = 0;
  for (const category of DEMO_CATEGORIES) {
    const bySlug = await prisma.category.findUnique({ where: { slug: category.slug } });
    if (bySlug) {
      categoryIds.set(category.id, bySlug.id); // نامک قبلاً استفاده شده؛ همان دسته استفاده می‌شود
      continue;
    }
    await prisma.category.create({
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: category.sortOrder,
        parentId: parents.get(category.parentSlug),
      },
    });
    categoryIds.set(category.id, category.id);
    createdCategories += 1;
  }

  // ---------- محصولات ----------
  let createdProducts = 0;
  for (const product of DEMO_PRODUCTS) {
    if (await prisma.product.findUnique({ where: { id: product.id } })) continue;

    const images: string[] = [];
    for (const color of product.colors) images.push(await makeImage(product.icon, color, product.brand));
    const stock = product.variants ? product.variants.reduce((sum, variant) => sum + variant.stock, 0) : product.stock ?? 0;

    await prisma.product.create({
      data: {
        id: product.id,
        title: product.title,
        description: product.description,
        brand: product.brand,
        price: product.price,
        discountPercent: product.discountPercent ?? 0,
        stock,
        imageUrl: images[0],
        specs: product.specs.map(([label, value]) => ({ label, value })),
        categoryId: categoryIds.get(product.category) ?? mobile.id,
        images: { create: images.slice(1).map((url, index) => ({ url, sortOrder: index + 1 })) },
        variants: product.variants
          ? { create: product.variants.map((variant, index) => ({ name: variant.name, price: variant.price ?? null, stock: variant.stock, sortOrder: index })) }
          : undefined,
      },
    });
    createdProducts += 1;
  }

  // ---------- کاربران، دیدگاه‌ها و سفارش‌های نمونه ----------
  for (const user of DEMO_USERS) {
    await prisma.user.upsert({ where: { id: user.id }, update: {}, create: { id: user.id, name: user.name } });
  }

  let createdReviews = 0;
  for (const [index, [productId, userIndex, rating, content]] of DEMO_REVIEWS.entries()) {
    const id = `demo_r_${index + 1}`;
    if (await prisma.review.findUnique({ where: { id } })) continue;
    if (!(await prisma.product.findUnique({ where: { id: productId } }))) continue;
    await prisma.review.create({
      data: { id, productId, userId: DEMO_USERS[userIndex].id, rating, content, isApproved: true },
    });
    createdReviews += 1;
  }

  let createdOrders = 0;
  for (const [index, [userIndex, daysAgo, lines]] of DEMO_ORDERS.entries()) {
    const id = `demo_o_${index + 1}`;
    if (await prisma.order.findUnique({ where: { id } })) continue;
    const products = await prisma.product.findMany({ where: { id: { in: lines.map(([productId]) => productId) } } });
    if (products.length !== lines.length) continue;

    const items = lines.map(([productId, quantity]) => {
      const product = products.find((item) => item.id === productId)!;
      return {
        productId,
        quantity,
        title: product.title,
        price: Math.round(product.price * (1 - product.discountPercent / 100)),
      };
    });
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    await prisma.order.create({
      data: {
        id,
        userId: DEMO_USERS[userIndex].id,
        status: "DELIVERED",
        subtotal,
        shippingCost: 0,
        totalAmount: subtotal,
        recipientName: DEMO_USERS[userIndex].name,
        recipientMobile: "09000000000",
        province: "تهران",
        city: "تهران",
        address: "آدرس نمونه (داده آزمایشی)",
        postalCode: "1111111111",
        shippingMethod: "پست پیشتاز",
        adminNote: "سفارش نمونه — با npm run demo:remove حذف می‌شود",
        createdAt,
        items: { create: items },
      },
    });
    createdOrders += 1;
  }

  console.log(
    `Demo data: ${createdCategories} categories, ${createdProducts} products, ${createdReviews} reviews, ${createdOrders} orders created.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

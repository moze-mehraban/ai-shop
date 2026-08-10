// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 شروع پاکسازی و تزریق داده‌های اولیه...');

  // پاکسازی داده‌های قبلی برای جلوگیری از خطای داده تکراری
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // ۱. ساخت کاربر نمونه (ادمین و کاربر معمولی)
  const admin = await prisma.user.create({
    data: {
      name: 'مدیر سیستم',
      email: 'admin@example.com',
      password: 'password123', // در حالت واقعی باید هش شود
      role: 'ADMIN',
    },
  });

  const user1 = await prisma.user.create({
    data: {
      name: 'علی محمدی',
      email: 'ali@example.com',
      password: 'password123',
      role: 'USER',
    },
  });

  // ۲. ساخت دسته‌بندی‌های نمونه
  const catMobile = await prisma.category.create({
    data: {
      name: 'موبایل و کالای دیجیتال',
      slug: 'mobile-digital',
    },
  });

  const catAccessories = await prisma.category.create({
    data: {
      name: 'لوازم جانبی',
      slug: 'accessories',
    },
  });

  // ۳. ساخت محصولات نمونه
  const product1 = await prisma.product.create({
    data: {
      title: 'گوشی موبایل مدل SuperPhone X',
      description: 'یک گوشی هوشمند با صفحه نمایش عالی و دوربین فوق‌العاده.',
      price: 25000000,
      discountPercent: 12,
      stock: 15,
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
      categoryId: catMobile.id,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      title: 'هندزفری بی‌سیم ProSound',
      description: 'کیفیت صدای شفاف با قابلیت حذف نویز فعال (ANC).',
      price: 3500000,
      discountPercent: 8,
      stock: 30,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      categoryId: catAccessories.id,
    },
  });

  // ۴. ساخت نظرات همراه با تحلیل آماده هوش مصنوعی (برای تست فرانت‌اند)
  await prisma.review.create({
    data: {
      rating: 5,
      content: 'گوشی خیلی عالی هست، سرعت پردازنده‌اش فوق‌العاده‌ست و صفحه‌نمایش خیلی شفافی داره. فقط قیمتش یکم بالاست.',
      userId: user1.id,
      productId: product1.id,
      isAnalyzed: true,
      sentiment: 'POSITIVE',
      strengths: ['صفحه‌نمایش شفاف', 'سرعت پردازنده بالا'],
      weaknesses: ['قیمت بالا'],
    },
  });

  await prisma.review.create({
    data: {
      rating: 2,
      content: 'کیفیت ساخت بدنه تعریفی نداره و شارژر توی جعبه نبود. شارژدهی باتری هم ضعیفه.',
      userId: user1.id,
      productId: product1.id,
      isAnalyzed: true,
      sentiment: 'NEGATIVE',
      strengths: [],
      weaknesses: ['کیفیت ساخت پایین', 'عدم وجود شارژر', 'شارژدهی ضعیف باتری'],
    },
  });

  console.log('✅ داده‌های اولیه با موفقیت وارد دیتابیس شدند!');
}

main()
  .catch((e) => {
    console.error('❌ خطا در ساخت داده‌های اولیه:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

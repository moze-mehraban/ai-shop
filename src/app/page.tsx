import DigikalaHeader from "@/components/DigikalaHeader";
import SiteFooter from "@/components/SiteFooter";
import ProductCard from "@/components/ProductCard";
import ProductRow, { ProductRowItem } from "@/components/ProductRow";
import { getDiscountedPrice } from "@/lib/pricing";
import { productCardInclude } from "@/lib/catalog";
import { getCategoryTree } from "@/lib/categories";
import { expireUnpaidOrders } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Flame, LayoutGrid, Sparkles, Star } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function HomePage() {
  await expireUnpaidOrders();
  const [products, discountedProducts, bestSellers, categoryTree] =
    await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        include: productCardInclude,
        orderBy: [{ createdAt: "desc" }],
        take: 12,
      }),
      prisma.product.findMany({
        where: { isActive: true, discountPercent: { gt: 0 }, stock: { gt: 0 } },
        include: productCardInclude,
        orderBy: [{ discountPercent: "desc" }],
        take: 12,
      }),
      prisma.product.findMany({
        where: { isActive: true, stock: { gt: 0 }, orderItems: { some: {} } },
        include: productCardInclude,
        orderBy: [{ orderItems: { _count: "desc" } }],
        take: 12,
      }),
      getCategoryTree(),
    ]);
  const categories = categoryTree.roots.map((category) => ({
    ...category,
    total: categoryTree.totals.get(category.id) ?? 0,
  }));

  return (
    <div className="min-h-screen bg-canvas text-slate-800">
      <DigikalaHeader />

      <main className="mx-auto mt-6 max-w-[1400px] space-y-10 px-4">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-slate-50 px-6 py-9 text-ink md:px-12 md:py-12">
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-amber-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-28 h-72 w-72 rounded-full bg-brand-100/80 blur-3xl" />
          <div className="relative max-w-2xl">
            <div>
              <h1 className="text-3xl leading-[1.5] font-black md:text-5xl md:leading-[1.4]">
                انتخاب مطمئن‌تر،
                <br />
                <span className="bg-gradient-to-l from-brand-600 to-ai-500 bg-clip-text text-transparent">
                  با خلاصه هوشمند نظرات
                </span>
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-8 text-slate-600">
                دیدگاه خریداران هر کالا با هوش مصنوعی تحلیل می‌شود تا نقاط قوت و
                ضعف را در چند ثانیه ببینید.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="#products" className="btn-primary">
                  مشاهده محصولات
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                {discountedProducts.length > 0 && (
                  <Link href="#amazing" className="btn-ghost">
                    <Flame className="h-4 w-4 text-orange-400" />
                    پیشنهادهای ویژه
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Amazing offers */}
        {discountedProducts.length > 0 && (
          <section
            id="amazing"
            className="scroll-mt-32 overflow-hidden rounded-[2rem] border border-slate-200/70 bg-slate-50 p-5 text-ink md:p-6"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
              <div className="flex shrink-0 flex-col items-center gap-3 text-center lg:w-56 lg:items-start lg:text-right">
                <span className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  تخفیف‌های واقعی فروشگاه
                </span>
                <h2 className="text-2xl font-black lg:text-3xl">
                  پیشنهادهای شگفت‌انگیز
                </h2>
                <p className="max-w-xs text-xs leading-7 text-slate-500">
                  محصولات تخفیف‌دار با قیمت نهایی محاسبه‌شده در سبد خرید و سفارش
                </p>
              </div>

              <div className="min-w-0 flex-1">
                <ProductRow>
                  {discountedProducts.slice(0, 12).map((product) => {
                    const finalPrice = getDiscountedPrice(
                      product.price,
                      product.discountPercent,
                    );
                    const averageRating =
                      product.reviews.length > 0
                        ? product.reviews.reduce(
                            (sum, review) => sum + review.rating,
                            0,
                          ) / product.reviews.length
                        : 0;

                    return (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        className="group flex w-44 shrink-0 snap-start flex-col rounded-2xl border border-slate-200/70 bg-white p-3 text-slate-800 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-52"
                      >
                        <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-slate-50">
                          {product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.imageUrl}
                              alt={product.title}
                              className="h-full w-full object-contain p-4 mix-blend-multiply transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-slate-300">
                              بدون تصویر
                            </div>
                          )}
                          {product.discountPercent > 0 && (
                            <span className="absolute top-2 right-2 rounded-full bg-brand-400 px-2 py-0.5 text-xs font-black text-brand-900">
                              {product.discountPercent.toLocaleString("fa-IR")}٪
                            </span>
                          )}
                        </div>
                        <h3 className="line-clamp-2 min-h-10 text-xs leading-5 font-bold text-ink">
                          {product.title}
                        </h3>
                        <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
                          <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {averageRating > 0
                              ? averageRating.toLocaleString("fa-IR", {
                                  maximumFractionDigits: 1,
                                })
                              : "جدید"}
                          </span>
                          <div className="text-left">
                            {product.discountPercent > 0 && (
                              <span className="block text-[11px] text-slate-400 line-through">
                                {product.price.toLocaleString("fa-IR")}
                              </span>
                            )}
                            <strong className="text-sm font-black">
                              {finalPrice.toLocaleString("fa-IR")}
                            </strong>
                            <span className="mr-1 text-[10px] text-slate-500">
                              تومان
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </ProductRow>
              </div>
            </div>
          </section>
        )}

        {/* Categories */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="section-title">خرید بر اساس دسته‌بندی</h2>
            <span className="text-xs text-slate-500">
              {categories.length.toLocaleString("fa-IR")} دسته
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="card group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-400 group-hover:text-brand-900">
                  <LayoutGrid className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-ink">
                    {category.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">
                    {category.total.toLocaleString("fa-IR")} کالا
                  </span>
                </span>
                <ArrowLeft className="h-4 w-4 text-slate-300 transition group-hover:-translate-x-1 group-hover:text-brand-600" />
              </Link>
            ))}
          </div>
        </section>

        {/* All products */}
        {bestSellers.length > 0 && (
          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="section-title">پرفروش‌ترین‌ها</h2>
              <Link
                href="/search?sort=bestselling"
                className="flex items-center gap-1 text-xs font-bold text-brand-700"
              >
                مشاهده همه
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
            <ProductRow>
              {bestSellers.map((product) => (
                <ProductRowItem key={product.id}>
                  <ProductCard product={product} />
                </ProductRowItem>
              ))}
            </ProductRow>
          </section>
        )}

        <section id="products" className="scroll-mt-32">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="section-title">جدیدترین محصولات</h2>
            <Link
              href="/search"
              className="flex items-center gap-1 text-xs font-bold text-brand-700"
            >
              مشاهده همه محصولات
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          <ProductRow>
            {products.map((product) => (
              <ProductRowItem key={product.id}>
                <ProductCard product={product} />
              </ProductRowItem>
            ))}
          </ProductRow>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

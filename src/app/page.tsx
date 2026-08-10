import DigikalaHeader from "@/components/DigikalaHeader";
import ProductCard from "@/components/ProductCard";
import { getDiscountedPrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Sparkles, Star } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
        reviews: {
          select: {
            rating: true,
            isAnalyzed: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);
  const discountedProducts = products.filter(
    (product) => product.discountPercent > 0,
  );
  const featuredProducts =
    discountedProducts.length > 0 ? discountedProducts : products;

  return (
    <div className="min-h-screen bg-slate-100 pb-16 text-slate-800">
      <DigikalaHeader />

      <main className="mx-auto mt-6 max-w-[1400px] space-y-8 px-4">
        <section
          id="amazing"
          className="rounded-3xl bg-[#ef394e] p-6 text-white shadow-xl"
        >
          <div className="flex flex-col items-center gap-6 lg:flex-row">
            <div className="flex shrink-0 flex-col items-center space-y-3 text-center lg:items-start lg:text-right">
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-rose-100 backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span>تخفیف‌های واقعی فروشگاه</span>
              </div>
              <h2 className="text-2xl font-black lg:text-3xl">
                پیشنهادهای شگفت‌انگیز
              </h2>
              <p className="max-w-xs text-xs leading-7 text-rose-100">
                محصولات تخفیف‌دار با قیمت نهایی محاسبه‌شده در سبد خرید و سفارش
              </p>
            </div>

            <div className="w-full flex-1 overflow-x-auto pb-2">
              <div className="flex min-w-max gap-4">
                {featuredProducts.slice(0, 8).map((product) => {
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
                      className="group flex w-56 flex-col justify-between rounded-2xl bg-white p-4 text-slate-800 shadow-md transition hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div>
                        <div className="relative mb-3 h-40 overflow-hidden rounded-xl bg-slate-50">
                          {product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.imageUrl}
                              alt={product.title}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-slate-300">
                              بدون تصویر
                            </div>
                          )}
                          {product.discountPercent > 0 && (
                            <span className="absolute top-2 right-2 rounded-full bg-[#ef394e] px-2 py-1 text-xs font-black text-white">
                              {product.discountPercent.toLocaleString("fa-IR")}٪
                            </span>
                          )}
                        </div>
                        <h3 className="line-clamp-2 min-h-10 text-xs leading-5 font-bold">
                          {product.title}
                        </h3>
                      </div>
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <div className="flex items-end justify-between">
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
                              <span className="block text-[10px] text-slate-400 line-through">
                                {product.price.toLocaleString("fa-IR")}
                              </span>
                            )}
                            <strong className="text-sm font-black">
                              {finalPrice.toLocaleString("fa-IR")}
                            </strong>
                            <span className="mr-1 text-[10px] text-slate-400">
                              تومان
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">
              خرید بر اساس دسته‌بندی
            </h2>
            <span className="text-xs text-slate-400">
              {categories.length.toLocaleString("fa-IR")} دسته
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700 transition hover:bg-rose-50 hover:text-[#ef394e]"
              >
                <span>{category.name}</span>
                <span className="flex items-center gap-2 text-[11px] text-slate-400">
                  {category._count.products.toLocaleString("fa-IR")} کالا
                  <ArrowLeft className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section id="products" className="scroll-mt-32 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">
              منتخب همه محصولات
            </h2>
            <span className="text-xs text-slate-500">
              {products.length.toLocaleString("fa-IR")} کالا
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

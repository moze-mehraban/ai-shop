import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DigikalaHeader from "@/components/DigikalaHeader";
import { Star, Sparkles, ArrowLeft, Percent } from "lucide-react";

export const revalidate = 0;

export default async function HomePage() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      reviews: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 dir-rtl pb-16">
      {/* هدر دیجی‌کالایی */}
      <DigikalaHeader />

      <main className="max-w-[1400px] mx-auto px-4 mt-6 space-y-8">
        {/* بخش پیشنهاد شگفت‌انگیز (طراحی قرمز اختصاصی دیجی‌کالا) */}
        <section className="bg-[#ef394e] rounded-3xl p-6 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* عنوان بخش شگفت‌انگیز */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-right space-y-3 shrink-0">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs text-rose-100 font-medium">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>تحلیل آنی با هوش مصنوعی</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-black">شگفت‌انگیزهای AI</h2>
              <p className="text-xs text-rose-100 max-w-xs leading-relaxed">
                محصولاتی که بیشترین درصد رضایت خریداران را طبق هوش مصنوعی کسب کرده‌اند.
              </p>
            </div>

            {/* لیست افقی کارت محصولات شگفت‌انگیز */}
            <div className="flex-1 w-full overflow-x-auto pb-2">
              <div className="flex gap-4 min-w-max">
                {products.map((product:any) => {
                  const analyzedCount = product.reviews.filter(
                    (r:any) => r.isAnalyzed
                  ).length;

                  return (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="w-56 bg-white text-slate-800 rounded-2xl p-4 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* تصویر محصول */}
                        <div className="relative h-40 bg-slate-50 rounded-xl overflow-hidden mb-3">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                              بدون تصویر
                            </div>
                          )}
                          {/* نشان درصد تخفیف دیجی‌کالایی */}
                          <span className="absolute top-2 right-2 bg-[#ef394e] text-white text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Percent className="w-3 h-3" />
                            <span>۱۵٪</span>
                          </span>
                        </div>

                        {/* عنوان */}
                        <h3 className="font-bold text-slate-800 text-xs line-clamp-2 leading-relaxed h-8">
                          {product.title}
                        </h3>
                      </div>

                      {/* آمار AI و قیمت */}
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                        {analyzedCount > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50 px-2 py-1 rounded-lg font-medium">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            <span>{analyzedCount} نظر تحلیل شده</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            {product.category.name}
                          </span>
                          <div className="text-left">
                            <span className="text-sm font-black text-slate-900 block">
                              {product.price.toLocaleString("fa-IR")}
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">
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

        {/* لیست کامل محصولات */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              منتخب همه محصولات
            </h2>
            <span className="text-xs text-slate-500">
              {products.length} کالا
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product:any) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-48 bg-slate-50 rounded-xl overflow-hidden mb-3">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                        بدون تصویر
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-800 text-xs line-clamp-2 leading-relaxed">
                    {product.title}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>۴.۵</span>
                  </div>

                  <div className="text-left">
                    <span className="text-sm font-black text-slate-900 block">
                      {product.price.toLocaleString("fa-IR")}
                    </span>
                    <span className="text-[10px] text-slate-400">تومان</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
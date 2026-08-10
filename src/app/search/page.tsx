import DigikalaHeader from "@/components/DigikalaHeader";
import ProductCard from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";
import { Search, SearchX } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = String(q ?? "")
    .trim()
    .slice(0, 100);

  const products =
    query.length >= 2
      ? await prisma.product.findMany({
          where: {
            OR: [
              {
                title: {
                  contains: query,
                },
              },
              {
                description: {
                  contains: query,
                },
              },
              {
                category: {
                  is: {
                    name: {
                      contains: query,
                    },
                  },
                },
              },
            ],
          },
          include: {
            category: true,
            reviews: {
              select: {
                rating: true,
              },
            },
          },
          orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
        })
      : [];

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <DigikalaHeader />
      <main className="mx-auto max-w-[1400px] px-4 py-8">
        <section className="mb-7 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-[#ef394e]">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400">نتایج جستجو</p>
              <h1 className="mt-1 text-2xl font-black text-slate-900">
                {query ? `جستجو برای «${query}»` : "جستجوی محصولات"}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {query.length >= 2
                  ? `${products.length.toLocaleString("fa-IR")} محصول پیدا شد`
                  : "برای جستجو حداقل دو کاراکتر وارد کنید."}
              </p>
            </div>
          </div>
        </section>

        {products.length > 0 ? (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>
        ) : query.length >= 2 ? (
          <section className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-5 text-center">
            <SearchX className="h-12 w-12 text-slate-300" />
            <h2 className="mt-5 text-lg font-black text-slate-800">
              محصولی پیدا نشد
            </h2>
            <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
              عبارت کوتاه‌تر یا نام دسته‌بندی دیگری را امتحان کنید.
            </p>
            <Link
              href="/"
              className="mt-6 rounded-xl bg-[#ef394e] px-5 py-2.5 text-xs font-bold text-white"
            >
              مشاهده همه محصولات
            </Link>
          </section>
        ) : (
          <section className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
            نام محصول، توضیحات یا دسته‌بندی را جستجو کنید.
          </section>
        )}
      </main>
    </div>
  );
}

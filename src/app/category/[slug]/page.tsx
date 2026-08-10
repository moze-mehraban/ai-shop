import DigikalaHeader from "@/components/DigikalaHeader";
import ProductCard from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, PackageSearch } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 0;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        include: {
          category: true,
          reviews: {
            select: { rating: true },
          },
        },
        orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <DigikalaHeader />
      <main className="mx-auto max-w-[1400px] px-4 py-8">
        <nav className="mb-5 flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="transition hover:text-[#ef394e]">
            فروشگاه
          </Link>
          <ChevronLeft className="h-4 w-4" />
          <span className="font-bold text-slate-700">{category.name}</span>
        </nav>

        <section className="mb-7 rounded-[2rem] bg-gradient-to-l from-slate-900 to-slate-800 p-7 text-white shadow-xl md:p-9">
          <p className="text-xs font-bold text-rose-300">دسته‌بندی محصولات</p>
          <h1 className="mt-2 text-3xl font-black">{category.name}</h1>
          <p className="mt-3 text-sm text-slate-400">
            {category.products.length.toLocaleString("fa-IR")} محصول در این
            دسته‌بندی
          </p>
        </section>

        {category.products.length > 0 ? (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {category.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>
        ) : (
          <section className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white text-center">
            <PackageSearch className="h-12 w-12 text-slate-300" />
            <h2 className="mt-4 font-black text-slate-700">
              محصولی در این دسته نیست
            </h2>
            <Link
              href="/"
              className="mt-5 rounded-xl bg-[#ef394e] px-5 py-2.5 text-xs font-bold text-white"
            >
              بازگشت به فروشگاه
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}

import DigikalaHeader from "@/components/DigikalaHeader";
import ProductListing from "@/components/ProductListing";
import SiteFooter from "@/components/SiteFooter";
import { parseCatalogParams, queryCatalog, type CatalogParams } from "@/lib/catalog";
import { searchProducts } from "@/lib/search";
import type { Metadata } from "next";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "جستجوی محصولات",
  robots: { index: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<CatalogParams>;
}) {
  const rawParams = await searchParams;
  const query = String(rawParams.q ?? "").trim().slice(0, 100);
  const parsed = parseCatalogParams(rawParams);
  const search = query ? await searchProducts(query) : null;

  const result = await queryCatalog({}, parsed, search ? search.ids : undefined);

  return (
    <div className="min-h-screen bg-canvas">
      <DigikalaHeader />
      <main className="mx-auto max-w-[1400px] px-4 py-6 md:py-8">
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400">
            {query ? "نتایج جستجو برای" : "همه محصولات"}
          </p>
          <h1 className="mt-1 text-2xl font-black text-ink">
            {query ? `«${query}»` : "فروشگاه"}
          </h1>
          {search?.approximate && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              نتیجه دقیقی پیدا نشد؛ نزدیک‌ترین نتایج نمایش داده می‌شود.
            </p>
          )}
        </div>

        <ProductListing
          basePath="/search"
          params={rawParams}
          parsed={parsed}
          {...result}
          emptyTitle={query ? "نتیجه‌ای برای این جستجو پیدا نشد" : "محصولی پیدا نشد"}
        />
      </main>
      <SiteFooter />
    </div>
  );
}

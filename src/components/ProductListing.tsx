import FilterPanel from "@/components/FilterPanel";
import ProductCard from "@/components/ProductCard";
import { buildQuery, type ParsedCatalogParams } from "@/lib/catalog";
import { SORT_LABELS, SPEC_SEPARATOR, toArray, type CatalogFacets, type CatalogParams, type SortKey } from "@/lib/catalogShared";
import { ArrowDownWideNarrow, ChevronLeft, ChevronRight, PackageSearch, X } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";

type Props = {
  basePath: string;
  params: CatalogParams;
  parsed: ParsedCatalogParams;
  total: number;
  pageCount: number;
  facets: CatalogFacets;
  products: ComponentProps<typeof ProductCard>["product"][];
  emptyTitle?: string;
};

const formatPrice = (value: string) => {
  const number = Number(value.replace(/[^\d۰-۹]/g, "").replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0)));
  return Number.isFinite(number) && number > 0 ? number.toLocaleString("fa-IR") : value;
};

export default function ProductListing({
  basePath,
  params,
  parsed,
  total,
  pageCount,
  facets,
  products,
  emptyTitle = "محصولی با این مشخصات پیدا نشد",
}: Props) {
  const current = params as Record<string, string | string[] | undefined>;
  const href = (changes: Record<string, string | string[] | null>) =>
    `${basePath}${buildQuery(current, { page: null, ...changes })}`;

  // فیلترهای فعال به‌صورت برچسب‌های قابل حذف
  const without = (key: "brand" | "spec", value: string) =>
    toArray(current[key] as string | string[] | undefined).filter((item) => item !== value);
  const chips: { label: string; href: string }[] = [
    ...(params.stock === "1" ? [{ label: "فقط موجود", href: href({ stock: null }) }] : []),
    ...(params.discount === "1" ? [{ label: "فقط تخفیف‌دار", href: href({ discount: null }) }] : []),
    ...(parsed.rating ? [{ label: `${parsed.rating.toLocaleString("fa-IR")} ستاره و بالاتر`, href: href({ rating: null }) }] : []),
    ...(params.min || params.max
      ? [{
          label: `قیمت ${params.min ? `از ${formatPrice(String(params.min))}` : ""} ${params.max ? `تا ${formatPrice(String(params.max))}` : ""}`.trim(),
          href: href({ min: null, max: null }),
        }]
      : []),
    ...(facets.categoryNav.current
      ? [{ label: facets.categoryNav.current.name, href: href({ cat: null, spec: null }) }]
      : []),
    ...parsed.brands.map((brand) => ({ label: brand, href: href({ brand: without("brand", brand) }) })),
    ...[...parsed.specs.entries()].flatMap(([label, values]) =>
      [...values].map((value) => ({
        label: `${label}: ${value}`,
        href: href({ spec: without("spec", `${label}${SPEC_SEPARATOR}${value}`) }),
      })),
    ),
  ];
  const clearAll = `${basePath}${buildQuery(
    params.q ? { q: params.q } : {},
    params.sort ? { sort: params.sort } : {},
  )}`;

  const defaultSort: SortKey = params.q ? "relevance" : "newest";

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
      <FilterPanel basePath={basePath} params={params} facets={facets} total={total} activeCount={chips.length} />

      <div className="min-w-0">
        {/* مرتب‌سازی */}
        <div className="card mb-3 flex items-center gap-x-1 gap-y-2 overflow-x-auto overflow-y-hidden no-scrollbar rounded-2xl px-4 py-2.5">
          <span className="ml-2 flex shrink-0 items-center gap-1.5 text-xs font-bold text-slate-500">
            <ArrowDownWideNarrow className="h-4 w-4" />
            مرتب‌سازی:
          </span>
          {(Object.keys(SORT_LABELS) as SortKey[])
            .filter((key) => key !== "relevance" || Boolean(params.q))
            .map((key) => (
              <Link
                key={key}
                href={href({ sort: key === defaultSort ? null : key })}
                scroll={false}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  parsed.sort === key ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:text-ink"
                }`}
              >
                {SORT_LABELS[key]}
              </Link>
            ))}
          <span className="mr-auto shrink-0 pr-2 text-xs text-slate-400">{total.toLocaleString("fa-IR")} کالا</span>
        </div>

        {/* فیلترهای فعال */}
        {chips.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <Link
                key={chip.label + chip.href}
                href={chip.href}
                scroll={false}
                className="flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 py-1 pr-3 pl-2 text-xs font-bold text-brand-800 transition hover:bg-brand-100"
              >
                {chip.label}
                <X className="h-3.5 w-3.5" />
              </Link>
            ))}
            {chips.length > 1 && (
              <Link href={clearAll} scroll={false} className="px-2 text-xs font-bold text-rose-600 hover:underline">
                حذف همه فیلترها
              </Link>
            )}
          </div>
        )}

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-5 text-center">
            <PackageSearch className="h-12 w-12 text-slate-300" />
            <h2 className="mt-4 font-black text-slate-700">{emptyTitle}</h2>
            {chips.length > 0 && (
              <>
                <p className="mt-2 text-sm text-slate-500">فیلترها را تغییر دهید یا حذف کنید.</p>
                <Link href={clearAll} className="btn-ghost mt-4 px-4 py-2 text-xs">
                  حذف همه فیلترها
                </Link>
              </>
            )}
          </div>
        )}

        {pageCount > 1 && (
          <nav aria-label="صفحه‌بندی" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
            {parsed.page > 1 && (
              <Link
                href={`${basePath}${buildQuery(current, { page: String(parsed.page - 1) })}`}
                className="flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 hover:border-brand-300"
              >
                <ChevronRight className="h-4 w-4" />
                قبلی
              </Link>
            )}
            {Array.from({ length: pageCount }, (_, index) => index + 1)
              .filter((page) => page === 1 || page === pageCount || Math.abs(page - parsed.page) <= 2)
              .map((page, index, pages) => (
                <span key={page} className="flex items-center gap-1.5">
                  {index > 0 && page - pages[index - 1] > 1 && <span className="text-slate-400">…</span>}
                  <Link
                    href={`${basePath}${buildQuery(current, { page: page === 1 ? null : String(page) })}`}
                    aria-current={page === parsed.page ? "page" : undefined}
                    className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold ${
                      page === parsed.page
                        ? "bg-brand-400 text-brand-900"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300"
                    }`}
                  >
                    {page.toLocaleString("fa-IR")}
                  </Link>
                </span>
              ))}
            {parsed.page < pageCount && (
              <Link
                href={`${basePath}${buildQuery(current, { page: String(parsed.page + 1) })}`}
                className="flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 hover:border-brand-300"
              >
                بعدی
                <ChevronLeft className="h-4 w-4" />
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}

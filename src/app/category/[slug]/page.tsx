import DigikalaHeader from "@/components/DigikalaHeader";
import ProductListing from "@/components/ProductListing";
import SiteFooter from "@/components/SiteFooter";
import { parseCatalogParams, queryCatalog, type CatalogParams } from "@/lib/catalog";
import { getAncestors, getCategoryTree, getDescendantIds } from "@/lib/categories";
import { getSettings } from "@/lib/settings";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CatalogParams>;
};

async function findCategory(slug: string) {
  const { nodes, totals } = await getCategoryTree();
  const decoded = decodeURIComponent(slug);
  const node = [...nodes.values()].find((item) => item.slug === decoded);
  return node ? { node, nodes, totals } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [found, settings] = await Promise.all([findCategory(slug), getSettings()]);

  if (!found) return {};

  return {
    title: `خرید ${found.node.name}`,
    description:
      found.node.description ||
      `خرید آنلاین ${found.node.name} با بهترین قیمت از ${settings.shopName}`,
    alternates: { canonical: `/category/${found.node.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const rawParams = await searchParams;
  const found = await findCategory(slug);

  if (!found) {
    notFound();
  }

  const { node, nodes, totals } = found;
  const ancestors = getAncestors(node, nodes);
  const parsed = parseCatalogParams(rawParams);
  const result = await queryCatalog(
    { categoryId: { in: getDescendantIds(node) } },
    parsed,
    undefined,
    node.id,
  );

  return (
    <div className="min-h-screen bg-canvas">
      <DigikalaHeader />
      <main className="mx-auto max-w-[1400px] px-4 py-6 md:py-8">
        <nav aria-label="مسیر صفحه" className="mb-5 flex flex-wrap items-center gap-1 text-xs text-slate-500">
          <Link href="/" className="transition hover:text-brand-600">
            فروشگاه
          </Link>
          {ancestors.map((ancestor) => (
            <span key={ancestor.id} className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4 text-slate-300" />
              <Link href={`/category/${ancestor.slug}`} className="transition hover:text-brand-600">
                {ancestor.name}
              </Link>
            </span>
          ))}
          <ChevronLeft className="h-4 w-4 text-slate-300" />
          <span className="font-bold text-slate-700">{node.name}</span>
        </nav>

        <section className="mb-6">
          <h1 className="text-2xl font-black text-ink md:text-3xl">{node.name}</h1>
          {node.description && (
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">{node.description}</p>
          )}

          {node.children.length > 0 && (
            <div className="mt-5 flex gap-2 overflow-x-auto overflow-y-hidden no-scrollbar pb-1">
              {node.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/category/${child.slug}`}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
                >
                  {child.name}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    {(totals.get(child.id) ?? 0).toLocaleString("fa-IR")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <ProductListing
          basePath={`/category/${node.slug}`}
          params={rawParams}
          parsed={parsed}
          {...result}
          emptyTitle="محصولی در این دسته‌بندی پیدا نشد"
        />
      </main>
      <SiteFooter />
    </div>
  );
}

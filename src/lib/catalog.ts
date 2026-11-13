import "server-only";
import {
  SORT_LABELS,
  SPEC_SEPARATOR,
  toArray,
  type CatalogFacets,
  type CatalogParams,
  type FacetOption,
  type SortKey,
} from "@/lib/catalogShared";
import { normalizeDigits } from "@/lib/digits";
import { getCategoryTree, getDescendantIds } from "@/lib/categories";
import { expireUnpaidOrders } from "@/lib/orders";
import { getDiscountedPrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export { buildQuery, SORT_LABELS, type CatalogParams, type SortKey } from "@/lib/catalogShared";

export const PAGE_SIZE = 20;

export type ParsedCatalogParams = {
  sort: SortKey;
  page: number;
  brands: string[];
  category: string | null;
  specs: Map<string, Set<string>>;
  min: number | null;
  max: number | null;
  inStock: boolean;
  discount: boolean;
  rating: number | null;
};

function toNumber(value?: string) {
  if (!value) return null;
  const number = Number(normalizeDigits(value).replace(/[,٬\s]/g, ""));
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function parseCatalogParams(params: CatalogParams): ParsedCatalogParams {
  const hasQuery = String(params.q ?? "").trim().length > 0;
  let sort = (params.sort && params.sort in SORT_LABELS ? params.sort : hasQuery ? "relevance" : "newest") as SortKey;
  if (sort === "relevance" && !hasQuery) sort = "newest";

  const specs = new Map<string, Set<string>>();
  for (const pair of toArray(params.spec).slice(0, 40)) {
    const index = pair.indexOf(SPEC_SEPARATOR);
    if (index <= 0) continue;
    const label = pair.slice(0, index);
    const value = pair.slice(index + SPEC_SEPARATOR.length);
    if (!value) continue;
    specs.set(label, (specs.get(label) ?? new Set()).add(value));
  }

  const rating = Number(params.rating);

  return {
    sort,
    page: Math.max(1, Math.floor(Number(params.page) || 1)),
    brands: toArray(params.brand).slice(0, 20),
    category: toArray(params.cat)[0] ?? null,
    specs,
    min: toNumber(params.min),
    max: toNumber(params.max),
    inStock: params.stock === "1",
    discount: params.discount === "1",
    rating: rating >= 1 && rating <= 5 ? rating : null,
  };
}

export const productCardInclude = {
  category: { select: { name: true } },
  reviews: { where: { isApproved: true }, select: { rating: true } },
} satisfies Prisma.ProductInclude;

type Row = {
  id: string;
  brand: string | null;
  categoryId: string;
  categoryName: string;
  finalPrice: number;
  discountPercent: number;
  stock: number;
  rating: number; // میانگین امتیاز (۰ = بدون امتیاز)
  sales: number;
  createdAt: number;
  // کلید = عنوان یکسان‌شده؛ مقدار نمایشی و مقدار یکسان‌شده برای مقایسه
  specs: Map<string, { label: string; value: string; valueKey: string }>;
  keyLabels: Set<string>; // مشخصاتی که مدیر «کلیدی» علامت زده
};

// یکسان‌سازی نوشتار مشخصات تا «۸ گیگابایت»، «8 گیگابایت» و «8  گیگ‌ابایت» یکی حساب شوند
export function normalizeSpec(value: string) {
  return normalizeDigits(value)
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\u200f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type MatchContext = {
  inCategory: Set<string> | null;
  specFilter: Map<string, Set<string>>; // عنوان یکسان‌شده ← مقادیر یکسان‌شده
};

// هر فیلتر به‌جز خودش اعمال می‌شود تا شمارنده‌ها «اگر این را هم انتخاب کنید» را نشان دهند
type FilterKey = "brand" | "category" | "price" | "stock" | "discount" | "rating" | `spec:${string}`;

function matches(row: Row, parsed: ParsedCatalogParams, skip: FilterKey | undefined, context: MatchContext) {
  const { inCategory, specFilter } = context;
  if (skip !== "brand" && parsed.brands.length && !(row.brand && parsed.brands.includes(row.brand))) return false;
  if (skip !== "category" && inCategory && !inCategory.has(row.categoryId)) return false;
  if (skip !== "price") {
    if (parsed.min !== null && row.finalPrice < parsed.min) return false;
    if (parsed.max !== null && row.finalPrice > parsed.max) return false;
  }
  if (skip !== "stock" && parsed.inStock && row.stock <= 0) return false;
  if (skip !== "discount" && parsed.discount && row.discountPercent <= 0) return false;
  if (skip !== "rating" && parsed.rating !== null && row.rating < parsed.rating) return false;
  for (const [labelKey, valueKeys] of specFilter) {
    if (skip === `spec:${labelKey}`) continue;
    const spec = row.specs.get(labelKey);
    if (!spec || !valueKeys.has(spec.valueKey)) return false;
  }
  return true;
}

function countBy(rows: Row[], key: (row: Row) => string | null | undefined) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = key(row);
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function toOptions(counts: Map<string, number>, selected: string[], label = (value: string) => value): FacetOption[] {
  // گزینه انتخاب‌شده حتی با شمارش صفر نمایش داده می‌شود تا قابل حذف باشد
  for (const value of selected) if (!counts.has(value)) counts.set(value, 0);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: label(value), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fa"));
}

const SORTERS: Record<SortKey, (a: Row, b: Row) => number> = {
  relevance: () => 0,
  newest: (a, b) => b.createdAt - a.createdAt,
  bestselling: (a, b) => b.sales - a.sales || b.createdAt - a.createdAt,
  rating: (a, b) => b.rating - a.rating || b.sales - a.sales,
  cheapest: (a, b) => a.finalPrice - b.finalPrice,
  expensive: (a, b) => b.finalPrice - a.finalPrice,
  discount: (a, b) => b.discountPercent - a.discountPercent || a.finalPrice - b.finalPrice,
};

export async function queryCatalog(
  baseWhere: Prisma.ProductWhereInput,
  parsed: ParsedCatalogParams,
  rankedIds?: string[],
  rootCategoryId?: string, // در صفحه دسته: ناوبری از زیرمجموعه‌های همین دسته شروع می‌شود
) {
  await expireUnpaidOrders();
  const { roots, nodes } = await getCategoryTree();
  const rootNode = rootCategoryId ? nodes.get(rootCategoryId) : undefined;
  const rootSet = rootNode ? new Set(getDescendantIds(rootNode)) : null;

  // دسته انتخاب‌شده فقط اگر وجود داشته باشد و داخل دسته صفحه باشد
  const selectedNode =
    parsed.category && nodes.has(parsed.category) && (!rootSet || (rootSet.has(parsed.category) && parsed.category !== rootCategoryId))
      ? nodes.get(parsed.category)!
      : undefined;
  const inCategory = selectedNode ? new Set(getDescendantIds(selectedNode)) : null;

  // نسخه سبک همه کالاهای این صفحه (دسته یا نتیجه جستجو) برای فیلتر و شمارش
  const raw = await prisma.product.findMany({
    where: { AND: [{ isActive: true }, baseWhere, rankedIds ? { id: { in: rankedIds } } : {}] },
    select: {
      id: true,
      brand: true,
      categoryId: true,
      category: { select: { name: true } },
      price: true,
      discountPercent: true,
      stock: true,
      specs: true,
      createdAt: true,
      reviews: { where: { isApproved: true }, select: { rating: true } },
      _count: { select: { orderItems: true } },
    },
    take: 5000,
  });

  const rows: Row[] = raw.map((product) => ({
    id: product.id,
    brand: product.brand?.trim() || null,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    finalPrice: getDiscountedPrice(product.price, product.discountPercent),
    discountPercent: product.discountPercent,
    stock: product.stock,
    rating: product.reviews.length
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0,
    sales: product._count.orderItems,
    createdAt: product.createdAt.getTime(),
    ...(() => {
      const specs: Row["specs"] = new Map();
      const keyLabels = new Set<string>();
      const list = Array.isArray(product.specs) ? (product.specs as { label?: unknown; value?: unknown; key?: unknown }[]) : [];
      for (const spec of list) {
        if (typeof spec?.label !== "string" || typeof spec?.value !== "string") continue;
        const label = spec.label.trim();
        const value = spec.value.trim();
        const labelKey = normalizeSpec(label);
        if (!labelKey || !value || specs.has(labelKey)) continue;
        specs.set(labelKey, { label, value, valueKey: normalizeSpec(value) });
        if (spec.key === true) keyLabels.add(labelKey);
      }
      return { specs, keyLabels };
    })(),
  }));

  const context: MatchContext = {
    inCategory,
    specFilter: new Map(
      [...parsed.specs.entries()].map(([label, values]) => [
        normalizeSpec(label),
        new Set([...values].map(normalizeSpec)),
      ]),
    ),
  };

  // ---------- نتیجه ----------
  const filtered = rows.filter((row) => matches(row, parsed, undefined, context));
  if (parsed.sort === "relevance" && rankedIds) {
    const rank = new Map(rankedIds.map((id, index) => [id, index]));
    filtered.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  } else {
    filtered.sort(SORTERS[parsed.sort]);
  }

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageIds = filtered.slice((parsed.page - 1) * PAGE_SIZE, parsed.page * PAGE_SIZE).map((row) => row.id);
  const pageProducts = pageIds.length
    ? await prisma.product.findMany({ where: { id: { in: pageIds } }, include: productCardInclude })
    : [];
  const products = pageProducts.sort((a, b) => pageIds.indexOf(a.id) - pageIds.indexOf(b.id));

  // ---------- فیلترها و شمارنده‌ها ----------
  const withoutSelf = (key: FilterKey) => rows.filter((row) => matches(row, parsed, key, context));

  // ناوبری دسته: زیرمجموعه‌های سطح فعلی با تعداد کالا (شامل زیرمجموعه‌های خودشان)
  const categoryBase = withoutSelf("category");
  const levelChildren = selectedNode ? selectedNode.children : rootNode ? rootNode.children : roots;
  const categoryOptions = levelChildren
    .map((child) => {
      const ids = new Set(getDescendantIds(child));
      return { value: child.id, label: child.name, count: categoryBase.filter((row) => ids.has(row.categoryId)).length };
    })
    .filter((option) => option.count > 0);
  let back: CatalogFacets["categoryNav"]["back"] = null;
  if (selectedNode) {
    const parent = selectedNode.parentId ? nodes.get(selectedNode.parentId) : undefined;
    back =
      parent && parent.id !== rootCategoryId
        ? { id: parent.id, label: parent.name }
        : { id: null, label: rootNode ? `همه ${rootNode.name}` : "همه دسته‌ها" };
  }

  // فیلترهای مشخصات: اولویت با مشخصاتی که در این دسته «کلیدی» علامت خورده‌اند
  // (بیشترین تکرار بین کالاها). اگر هیچ مشخصه کلیدی‌ای نباشد، مشخصات پرتکرار با مقادیر محدود.
  const scopeRows = inCategory ? rows.filter((row) => inCategory.has(row.categoryId)) : rows;
  const stats = new Map<string, { coverage: number; keyCount: number; values: Set<string>; labels: Map<string, number> }>();
  for (const row of scopeRows) {
    for (const [labelKey, spec] of row.specs) {
      const stat = stats.get(labelKey) ?? { coverage: 0, keyCount: 0, values: new Set(), labels: new Map() };
      stat.coverage += 1;
      if (row.keyLabels.has(labelKey)) stat.keyCount += 1;
      stat.values.add(spec.valueKey);
      stat.labels.set(spec.label, (stat.labels.get(spec.label) ?? 0) + 1);
      stats.set(labelKey, stat);
    }
  }
  const usesKeySpecs = [...stats.values()].some((stat) => stat.keyCount > 0);
  const eligible = [...stats.entries()].filter(([labelKey, stat]) => {
    if (context.specFilter.has(labelKey)) return true;
    if (stat.values.size < 2 || stat.coverage < 2) return false;
    return usesKeySpecs ? stat.keyCount > 0 : stat.values.size <= 15;
  });
  eligible.sort(([, a], [, b]) => (usesKeySpecs ? b.keyCount - a.keyCount : 0) || b.coverage - a.coverage);

  const mostCommon = (counts: Map<string, number>) => [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];

  const specFacets = eligible.slice(0, 6).map(([labelKey, stat]) => {
    // گزینه‌ها بر اساس مقدار یکسان‌شده گروه می‌شوند و رایج‌ترین نوشتار نمایش داده می‌شود
    const groups = new Map<string, { count: number; spellings: Map<string, number> }>();
    for (const row of withoutSelf(`spec:${labelKey}`)) {
      const spec = row.specs.get(labelKey);
      if (!spec) continue;
      const group = groups.get(spec.valueKey) ?? { count: 0, spellings: new Map() };
      group.count += 1;
      group.spellings.set(spec.value, (group.spellings.get(spec.value) ?? 0) + 1);
      groups.set(spec.valueKey, group);
    }
    const selected = context.specFilter.get(labelKey) ?? new Set<string>();
    const selectedRaw = [...parsed.specs.entries()].find(([label]) => normalizeSpec(label) === labelKey)?.[1] ?? new Set<string>();
    for (const raw of selectedRaw) {
      if (!groups.has(normalizeSpec(raw))) groups.set(normalizeSpec(raw), { count: 0, spellings: new Map([[raw, 1]]) });
    }
    // مقدار انتخاب‌شده با همان نوشتار آدرس نمایش داده می‌شود تا تیکش درست بماند
    const display = (valueKey: string, spellings: Map<string, number>) =>
      [...selectedRaw].find((raw) => normalizeSpec(raw) === valueKey) ?? mostCommon(spellings);

    return {
      label: [...parsed.specs.keys()].find((label) => normalizeSpec(label) === labelKey) ?? mostCommon(stat.labels),
      options: [...groups.entries()]
        .map(([valueKey, group]) => {
          const value = display(valueKey, group.spellings);
          // نمایش با ارقام فارسی؛ مقدار آدرس همان نوشتار اصلی می‌ماند
          return { value, label: value.replace(/[0-9]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]), count: group.count };
        })
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fa")),
      selected: selected.size > 0,
    };
  })
    .filter((facet) => facet.options.length >= 2 || facet.selected)
    .map(({ label, options }) => ({ label, options }));

  const prices = withoutSelf("price").map((row) => row.finalPrice);
  const ratingBase = withoutSelf("rating");

  const facets: CatalogFacets = {
    brands: toOptions(countBy(withoutSelf("brand"), (row) => row.brand), parsed.brands),
    categoryNav: {
      current: selectedNode ? { id: selectedNode.id, name: selectedNode.name } : null,
      back,
      options: categoryOptions,
    },
    specs: specFacets,
    inStockCount: withoutSelf("stock").filter((row) => row.stock > 0).length,
    discountCount: withoutSelf("discount").filter((row) => row.discountPercent > 0).length,
    rating4Count: ratingBase.filter((row) => row.rating >= 4).length,
    rating3Count: ratingBase.filter((row) => row.rating >= 3).length,
    priceBounds: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
  };

  return { total, products, pageCount, facets };
}

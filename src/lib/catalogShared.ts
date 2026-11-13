// بخش‌های مشترک فیلتر/مرتب‌سازی که هم سرور و هم پنل فیلتر (کلاینت) استفاده می‌کنند

export const SORT_LABELS = {
  relevance: "مرتبط‌ترین",
  newest: "جدیدترین",
  bestselling: "پرفروش‌ترین",
  rating: "بیشترین امتیاز",
  cheapest: "ارزان‌ترین",
  expensive: "گران‌ترین",
  discount: "بیشترین تخفیف",
} as const;

export type SortKey = keyof typeof SORT_LABELS;

// نام پارامترهای آدرس صفحه
export type CatalogParams = {
  q?: string;
  sort?: string;
  page?: string;
  brand?: string | string[];
  cat?: string; // فقط یک دسته (به همراه زیرمجموعه‌هایش)
  spec?: string | string[]; // «عنوان::مقدار»
  min?: string;
  max?: string;
  stock?: string;
  discount?: string;
  rating?: string;
};

export const SPEC_SEPARATOR = "::";

export type FacetOption = { value: string; label: string; count: number };
export type SpecFacet = { label: string; options: FacetOption[] };

// ناوبری دسته‌بندی: دسته فعلی، مسیر بازگشت و زیرمجموعه‌های قابل انتخاب
export type CategoryNav = {
  current: { id: string; name: string } | null;
  back: { id: string | null; label: string } | null; // id = null یعنی حذف فیلتر دسته
  options: FacetOption[];
};

export type CatalogFacets = {
  brands: FacetOption[];
  categoryNav: CategoryNav;
  specs: SpecFacet[];
  inStockCount: number;
  discountCount: number;
  rating4Count: number;
  rating3Count: number;
  priceBounds: { min: number; max: number } | null;
};

export function toArray(value?: string | string[]) {
  return (Array.isArray(value) ? value : value ? [value] : []).map((item) => item.trim()).filter(Boolean);
}

export function buildQuery(
  current: Record<string, string | string[] | undefined>,
  changes: Record<string, string | string[] | null>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    for (const item of toArray(value)) search.append(key, item);
  }
  for (const [key, value] of Object.entries(changes)) {
    search.delete(key);
    for (const item of value === null ? [] : Array.isArray(value) ? value : [value]) {
      search.append(key, item);
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

"use client";

import {
  buildQuery,
  SPEC_SEPARATOR,
  toArray,
  type CatalogFacets,
  type CatalogParams,
  type FacetOption,
} from "@/lib/catalogShared";
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  basePath: string;
  params: CatalogParams;
  facets: CatalogFacets;
  total: number;
  activeCount: number;
};

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group border-b border-slate-100 py-3 last:border-b-0" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-sm font-black text-ink">
        {title}
        <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
      </summary>
      <div className="pt-2">{children}</div>
    </details>
  );
}

function Check({
  checked,
  disabled,
  onChange,
  label,
  count,
  type = "checkbox",
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: React.ReactNode;
  count?: number;
  type?: "checkbox" | "radio";
}) {
  return (
    <label
      className={`flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm transition ${
        disabled ? "cursor-not-allowed text-slate-300" : "cursor-pointer text-slate-700 hover:bg-slate-50"
      }`}
    >
      <input
        type={type}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="h-4 w-4 shrink-0 accent-brand-500"
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && <span className="text-xs text-slate-400">{count.toLocaleString("fa-IR")}</span>}
    </label>
  );
}

export default function FilterPanel({ basePath, params, facets, total, activeCount }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [brandQuery, setBrandQuery] = useState("");
  const current = params as Record<string, string | string[] | undefined>;

  const navigate = (changes: Record<string, string | string[] | null>) => {
    startTransition(() => {
      router.push(`${basePath}${buildQuery(current, { ...changes, page: null })}`, { scroll: false });
    });
  };

  // دسته فقط یکی است؛ با انتخاب، فیلترهای مشخصات دسته قبلی معنا ندارند و پاک می‌شوند
  const selectCategory = (id: string | null) => {
    navigate({ cat: id, spec: null });
  };

  const toggleIn = (key: "brand" | "spec", value: string) => {
    const values = toArray(current[key] as string | string[] | undefined);
    navigate({ [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] });
  };

  const isSelected = (key: "brand" | "spec", value: string) =>
    toArray(current[key] as string | string[] | undefined).includes(value);

  const optionList = (key: "brand", options: FacetOption[]) =>
    options.map((option) => (
      <Check
        key={option.value}
        checked={isSelected(key, option.value)}
        disabled={option.count === 0 && !isSelected(key, option.value)}
        onChange={() => toggleIn(key, option.value)}
        label={option.label}
        count={option.count}
      />
    ));

  const visibleBrands = facets.brands.filter((brand) =>
    brand.label.toLowerCase().includes(brandQuery.trim().toLowerCase()),
  );

  const content = (
    <div>
      {(facets.categoryNav.current || facets.categoryNav.options.length > 0) && (
        <Section title="دسته‌بندی">
          <nav aria-label="دسته‌بندی" className="space-y-0.5">
            {facets.categoryNav.back && (
              <button
                type="button"
                onClick={() => selectCategory(facets.categoryNav.back!.id)}
                className="flex w-full items-center gap-1 rounded-lg px-1 py-1.5 text-xs font-bold text-slate-500 transition hover:text-brand-700"
              >
                <ChevronRight className="h-3.5 w-3.5" />
                {facets.categoryNav.back.label}
              </button>
            )}
      <Section title="وضعیت کالا">
        <Check
          checked={params.stock === "1"}
          onChange={() => navigate({ stock: params.stock === "1" ? null : "1" })}
          label="فقط کالاهای موجود"
          count={facets.inStockCount}
        />
        <Check
          checked={params.discount === "1"}
          disabled={facets.discountCount === 0 && params.discount !== "1"}
          onChange={() => navigate({ discount: params.discount === "1" ? null : "1" })}
          label="فقط کالاهای تخفیف‌دار"
          count={facets.discountCount}
        />
      </Section>

      <Section title="محدوده قیمت (تومان)">
        <form
          key={`${params.min ?? ""}-${params.max ?? ""}`}
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const min = String(form.get("min") ?? "").trim();
            const max = String(form.get("max") ?? "").trim();
            navigate({ min: min || null, max: max || null });
          }}
          className="space-y-2"
        >
          <div className="grid grid-cols-2 gap-2">
            <input
              name="min"
              inputMode="numeric"
              defaultValue={params.min ?? ""}
              placeholder={facets.priceBounds ? `از ${facets.priceBounds.min.toLocaleString("fa-IR")}` : "از"}
              className="field px-3 py-2 text-xs"
              aria-label="حداقل قیمت"
            />
            <input
              name="max"
              inputMode="numeric"
              defaultValue={params.max ?? ""}
              placeholder={facets.priceBounds ? `تا ${facets.priceBounds.max.toLocaleString("fa-IR")}` : "تا"}
              className="field px-3 py-2 text-xs"
              aria-label="حداکثر قیمت"
            />
          </div>
          <button type="submit" className="btn-ghost w-full py-2 text-xs">
            اعمال محدوده قیمت
          </button>
        </form>
      </Section>

      <Section title="امتیاز خریداران">
        {[4, 3].map((stars) => (
          <Check
            key={stars}
            type="radio"
            checked={params.rating === String(stars)}
            disabled={(stars === 4 ? facets.rating4Count : facets.rating3Count) === 0 && params.rating !== String(stars)}
            onChange={() => navigate({ rating: params.rating === String(stars) ? null : String(stars) })}
            label={
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {stars.toLocaleString("fa-IR")} ستاره و بالاتر
              </span>
            }
            count={stars === 4 ? facets.rating4Count : facets.rating3Count}
          />
        ))}
        {params.rating && (
          <button type="button" onClick={() => navigate({ rating: null })} className="mt-1 text-xs font-bold text-brand-700">
            همه امتیازها
          </button>
        )}
      </Section>

            {facets.categoryNav.current && (
              <p className="rounded-lg bg-brand-50 px-2.5 py-2 text-sm font-black text-brand-800">
                {facets.categoryNav.current.name}
              </p>
            )}
            <ul className={facets.categoryNav.current ? "border-r-2 border-slate-100 pr-2" : ""}>
              {facets.categoryNav.options.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => selectCategory(option.value)}
                    className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-right text-sm text-slate-700 transition hover:bg-slate-50 hover:text-brand-700"
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    <span className="text-xs text-slate-400">{option.count.toLocaleString("fa-IR")}</span>
                    <ChevronLeft className="h-3.5 w-3.5 text-slate-300" />
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </Section>
      )}

      {facets.brands.length > 0 && (
        <Section title="برند">
          {facets.brands.length > 8 && (
            <div className="relative mb-2">
              <Search className="absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={brandQuery}
                onChange={(event) => setBrandQuery(event.target.value)}
                placeholder="جستجوی برند"
                className="field py-2 pr-8 text-xs"
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto">{optionList("brand", visibleBrands)}</div>
        </Section>
      )}

      {facets.specs.map((facet, index) => (
        <Section key={facet.label} title={facet.label} defaultOpen={index < 2}>
          <div className="max-h-60 overflow-y-auto">
            {facet.options.map((option) => {
              const value = `${facet.label}${SPEC_SEPARATOR}${option.value}`;
              return (
                <Check
                  key={option.value}
                  checked={isSelected("spec", value)}
                  disabled={option.count === 0 && !isSelected("spec", value)}
                  onChange={() => toggleIn("spec", value)}
                  label={option.label}
                  count={option.count}
                />
              );
            })}
          </div>
        </Section>
      ))}
    </div>
  );

  return (
    <>
      {/* موبایل: دکمه باز کردن فیلترها */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="btn-ghost w-full justify-between py-2.5 lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-brand-600" />
          فیلترها
        </span>
        {activeCount > 0 && (
          <span className="rounded-full bg-brand-400 px-2 py-0.5 text-xs text-brand-900">
            {activeCount.toLocaleString("fa-IR")}
          </span>
        )}
      </button>

      {/* دسکتاپ */}
      <aside className="card hidden rounded-2xl px-4 py-2 lg:sticky lg:top-32 lg:block lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 py-2">
          <span className="flex items-center gap-2 font-black text-ink">
            <SlidersHorizontal className="h-4 w-4 text-brand-600" />
            فیلترها
            {isPending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          </span>
        </div>
        {content}
      </aside>

      {/* موبایل: پنل تمام‌صفحه */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white lg:hidden" role="dialog" aria-modal="true" aria-label="فیلترها">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <span className="flex items-center gap-2 font-black text-ink">
              <SlidersHorizontal className="h-4 w-4 text-brand-600" />
              فیلترها
              {isPending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            </span>
            <button type="button" onClick={() => setMobileOpen(false)} aria-label="بستن" className="rounded-full p-2 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4">{content}</div>
          <div className="border-t border-slate-200 p-4">
            <button type="button" onClick={() => setMobileOpen(false)} className="btn-primary w-full">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              نمایش {total.toLocaleString("fa-IR")} کالا
            </button>
          </div>
        </div>
      )}
    </>
  );
}

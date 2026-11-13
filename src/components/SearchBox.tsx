"use client";

/* eslint-disable @next/next/no-img-element */
import { LayoutGrid, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

type Suggestion = {
  products: { id: string; title: string; imageUrl: string | null; price: number; inStock: boolean }[];
  categories: { name: string; slug: string }[];
  total: number;
  approximate: boolean;
};

const EMPTY: Suggestion = { products: [], categories: [], total: 0, approximate: false };

export default function SearchBox({
  placeholder,
  className = "",
}: {
  placeholder: string;
  className?: string;
}) {
  const router = useRouter();
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ query: string; data: Suggestion }>({ query: "", data: EMPTY });
  const [active, setActive] = useState(-1);

  // درخواست با تأخیر کوتاه بعد از توقف تایپ
  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          setResult({ query: value, data: await response.json() });
          setActive(-1);
        }
      } catch {
        /* درخواست لغو شد */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // نتایج قبلی تا رسیدن پاسخ عبارت جدید نمایش داده نمی‌شوند
  const isFresh = result.query === query.trim();
  const data = isFresh ? result.data : EMPTY;
  const links = [
    ...data.categories.map((category) => `/category/${category.slug}`),
    ...data.products.map((product) => `/product/${product.id}`),
  ];

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (active >= 0 && links[active]) return go(links[active]);
    const value = query.trim();
    go(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  };

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form onSubmit={submit} role="search">
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((current) => Math.min(links.length - 1, current + 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((current) => Math.max(-1, current - 1));
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          aria-label="جستجوی محصولات"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          autoComplete="off"
          className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pr-11 pl-4 text-sm text-slate-800 transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="جستجو"
          className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full p-2 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2 shadow-[var(--shadow-card-hover)]"
        >
          {data.categories.length > 0 && (
            <div className="mb-1 flex flex-wrap gap-1.5 border-b border-slate-100 p-2">
              {data.categories.map((category, categoryIndex) => {
                const isActive = categoryIndex === active;
                return (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    onClick={() => setOpen(false)}
                    role="option"
                    aria-selected={isActive}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      isActive ? "bg-brand-400 text-brand-900" : "bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    در دسته {category.name}
                  </Link>
                );
              })}
            </div>
          )}

          {data.products.map((product, productIndex) => {
            const isActive = data.categories.length + productIndex === active;
            return (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                onClick={() => setOpen(false)}
                role="option"
                aria-selected={isActive}
                className={`flex items-center gap-3 rounded-xl p-2 transition ${isActive ? "bg-brand-50" : "hover:bg-slate-50"}`}
              >
                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-sm font-bold text-ink">{product.title}</span>
                  <span className="text-xs text-slate-500">
                    {product.inStock ? `${product.price.toLocaleString("fa-IR")} تومان` : "ناموجود"}
                  </span>
                </span>
              </Link>
            );
          })}

          {!isFresh && (
            <p className="flex items-center justify-center gap-2 p-4 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال جستجو...
            </p>
          )}

          {isFresh && data.approximate && data.products.length > 0 && (
            <p className="px-2 pt-1 pb-2 text-xs font-bold text-amber-700">منظورتان این بود؟</p>
          )}

          {isFresh && !loading && data.products.length === 0 && data.categories.length === 0 && (
            <p className="p-4 text-center text-sm text-slate-400">نتیجه‌ای پیدا نشد؛ Enter را برای جستجوی کامل بزنید.</p>
          )}

          {data.total > data.products.length && (
            <button
              type="button"
              onClick={() => go(`/search?q=${encodeURIComponent(query.trim())}`)}
              className="mt-1 w-full rounded-xl bg-slate-50 py-2.5 text-xs font-bold text-brand-700 hover:bg-brand-50"
            >
              مشاهده همه {data.total.toLocaleString("fa-IR")} نتیجه
            </button>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/components/CartProvider";
import SearchBox from "@/components/SearchBox";
import {
  ShoppingCart,
  User,
  Menu,
  ChevronDown,
  Sparkles,
  Tag,
  Flame,
  LogOut,
  Package,
  LayoutDashboard,
  Heart,
  Loader2,
  UserRoundCog,
} from "lucide-react";

type HeaderCategory = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  children: HeaderCategory[];
};

export default function HeaderClient({
  shopName,
  shopTagline,
}: {
  shopName: string;
  shopTagline: string;
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [categories, setCategories] = useState<HeaderCategory[]>([]);
  const [activeRootId, setActiveRootId] = useState<string | null>(null);
  const activeRoot =
    categories.find((category) => category.id === activeRootId) ?? categories[0];
  const { itemCount } = useCart();
  
  // دریافت وضعیت سشن کاربر از NextAuth
  const { data: session, status } = useSession();

  useEffect(() => {
    let isActive = true;

    fetch("/api/categories")
      .then((response) => (response.ok ? response.json() : []))
      .then((data: HeaderCategory[]) => {
        if (isActive) {
          setCategories(data);
        }
      })
      .catch(() => {
        if (isActive) {
          setCategories([]);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);



  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
      {/* بخش بالای هدر: لوگو، جستجو و ورود/سبد خرید */}
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 md:gap-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${shopName} صفحه اصلی`}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[var(--shadow-brand)]">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="max-w-[12rem] truncate text-lg font-black tracking-tight text-ink" dir="auto">
              {shopName}
            </span>
            {shopTagline && (
              <span className="text-[10px] font-medium text-slate-400">{shopTagline}</span>
            )}
          </span>
        </Link>

        <SearchBox
          placeholder="جستجو در میان محصولات، برندها و دسته‌ها..."
          className="hidden max-w-2xl flex-1 sm:block"
        />

        {/* سمت چپ: دکمه ورود یا پروفایل کاربر + سبد خرید */}
        <div className="flex shrink-0 items-center gap-2">
          {status === "loading" ? (
            <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3.5 py-2 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">در حال بررسی...</span>
            </div>
          ) : session?.user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-expanded={isUserMenuOpen}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pr-1.5 pl-3 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <User className="h-4 w-4" />
                </span>
                <span className="hidden max-w-[110px] truncate sm:inline">
                  {session.user.name || session.user.email || "حساب کاربری"}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition ${isUserMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isUserMenuOpen && (
                <div className="absolute left-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1.5 text-sm text-slate-700 shadow-[var(--shadow-card-hover)]">
                  <div className="mb-1 rounded-xl bg-slate-50 px-3 py-3">
                    <p className="truncate font-bold text-ink">
                      {session.user.name || "کاربر"}
                    </p>
                    {session.user.email && (
                      <p className="mt-0.5 truncate text-right text-[11px] text-slate-400" dir="ltr">
                        {session.user.email}
                      </p>
                    )}
                  </div>

                  {[
                    { href: "/profile", label: "اطلاعات حساب", Icon: UserRoundCog },
                    { href: "/profile/orders", label: "سفارش‌های من", Icon: Package },
                    { href: "/profile/wishlist", label: "علاقه‌مندی‌ها", Icon: Heart },
                  ].map(({ href, label, Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition hover:bg-slate-50 hover:text-ink"
                    >
                      <Icon className="h-4 w-4 text-slate-400" />
                      <span>{label}</span>
                    </Link>
                  ))}

                  {session.user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-bold text-ai-700 transition hover:bg-ai-50"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>پنل مدیریت</span>
                    </Link>
                  )}

                  <div className="my-1 h-px bg-slate-100" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 font-bold text-brand-700 transition hover:bg-brand-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>خروج از حساب</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <User className="h-4 w-4 text-slate-500" />
              <span>ورود | ثبت‌نام</span>
            </Link>
          )}

          <Link
            href="/cart"
            aria-label="سبد خرید"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -left-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-400 px-1 text-[10px] font-bold text-brand-900 ring-2 ring-white">
                {itemCount.toLocaleString("fa-IR")}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="px-4 pb-3 sm:hidden">
        <SearchBox placeholder="جستجوی محصول..." />
      </div>

      {/* بخش پایین هدر: منوی دسته‌بندی‌ها و لینک‌های سریع */}
      <nav className="border-t border-slate-100">
        <div className="mx-auto flex max-w-[1400px] items-center gap-1 px-4 text-xs font-medium text-slate-600">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCategoryMenuOpen((open) => !open)}
              aria-expanded={isCategoryMenuOpen}
              className="flex items-center gap-1.5 rounded-lg px-2 py-2.5 font-bold text-ink transition hover:text-brand-600"
            >
              <Menu className="h-4 w-4" />
              <span>دسته‌بندی کالاها</span>
              <ChevronDown
                className={`h-3 w-3 text-slate-400 transition ${isCategoryMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isCategoryMenuOpen && (
              <div className="absolute top-full right-0 z-50 mt-2 flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-3xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-card-hover)]">
                {/* ستون دسته‌های اصلی */}
                <div className="w-full shrink-0 overflow-y-auto p-2 sm:w-60 sm:border-l sm:border-slate-100">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      onClick={() => setIsCategoryMenuOpen(false)}
                      onMouseEnter={() => setActiveRootId(category.id)}
                      onFocus={() => setActiveRootId(category.id)}
                      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                        activeRoot?.id === category.id
                          ? "bg-brand-50 text-brand-700"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{category.name}</span>
                      {category.children.length > 0 ? (
                        <ChevronDown className="h-3.5 w-3.5 rotate-90 text-slate-400" />
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">
                          {category.productCount.toLocaleString("fa-IR")}
                        </span>
                      )}
                    </Link>
                  ))}
                  {categories.length === 0 && (
                    <p className="px-3 py-5 text-center text-xs text-slate-400">
                      دسته‌بندی‌ای ثبت نشده است.
                    </p>
                  )}
                </div>

                {/* زیرمجموعه‌های دسته انتخاب‌شده (دسکتاپ) */}
                {activeRoot && (
                  <div className="hidden flex-1 overflow-y-auto p-5 sm:block">
                    <Link
                      href={`/category/${activeRoot.slug}`}
                      onClick={() => setIsCategoryMenuOpen(false)}
                      className="mb-4 inline-flex items-center gap-1 text-sm font-black text-brand-700"
                    >
                      همه کالاهای {activeRoot.name}
                      <ChevronDown className="h-3.5 w-3.5 rotate-90" />
                    </Link>
                    {activeRoot.children.length > 0 ? (
                      <div className="columns-2 gap-6">
                        {activeRoot.children.map((child) => (
                          <div key={child.id} className="mb-4 break-inside-avoid">
                            <Link
                              href={`/category/${child.slug}`}
                              onClick={() => setIsCategoryMenuOpen(false)}
                              className="flex items-center gap-2 border-r-2 border-brand-500 pr-2 text-sm font-bold text-ink hover:text-brand-700"
                            >
                              {child.name}
                            </Link>
                            <div className="mt-2 space-y-1.5 pr-2.5">
                              {child.children.map((grandchild) => (
                                <Link
                                  key={grandchild.id}
                                  href={`/category/${grandchild.slug}`}
                                  onClick={() => setIsCategoryMenuOpen(false)}
                                  className="block text-xs text-slate-500 hover:text-brand-700"
                                >
                                  {grandchild.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        این دسته زیرمجموعه‌ای ندارد.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <span className="mx-2 hidden h-4 w-px bg-slate-200 md:block" />

          <Link
            href="/#amazing"
            className="hidden items-center gap-1.5 rounded-lg px-2 py-2.5 transition hover:text-brand-600 md:flex"
          >
            <Flame className="h-4 w-4 text-orange-500" />
            <span>پیشنهادهای شگفت‌انگیز</span>
          </Link>

          <Link
            href="/search"
            className="hidden items-center gap-1.5 rounded-lg px-2 py-2.5 transition hover:text-brand-600 md:flex"
          >
            <Tag className="h-4 w-4 text-slate-400" />
            <span>همه محصولات</span>
          </Link>

        </div>
      </nav>
    </header>
  );
}

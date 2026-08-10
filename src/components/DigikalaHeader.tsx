'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/components/CartProvider";
import {
  Search,
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
};

export default function DigikalaHeader() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [categories, setCategories] = useState<HeaderCategory[]>([]);
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

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();

    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      {/* بخش بالای هدر: لوگو، جستجو و ورود/سبد خرید */}
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
        
        {/* سمت راست: لوگو و باکس جستجو */}
        <div className="flex items-center gap-6 flex-1 max-w-3xl">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-[#ef394e] text-white p-2 rounded-xl font-black text-xl tracking-tighter">
              AI-Shop
            </div>
          </Link>

          <form
            onSubmit={handleSearch}
            className="relative hidden flex-1 sm:block"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در میان محصولات و تحلیل‌های هوشمند..."
              aria-label="جستجوی محصولات"
              className="w-full bg-slate-100 text-slate-800 text-xs py-2.5 pr-10 pl-4 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#ef394e]/20 focus:border-[#ef394e] border border-transparent transition-all"
            />
            <button
              type="submit"
              aria-label="جستجو"
              className="absolute right-2 top-1.5 rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-[#ef394e]"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* سمت چپ: دکمه ورود یا پروفایل کاربر + سبد خرید */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* حالت ۱: بارگذاری اولیه سشن */}
          {status === "loading" ? (
            <div className="flex items-center gap-2 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              <span>در حال بررسی...</span>
            </div>
          ) : session?.user ? (
            
            /* حالت ۲: کاربر وارد شده است */
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4 text-[#ef394e]" />
                <span className="dir-ltr text-right truncate max-w-[110px]">
                  {session.user.name || session.user.email || "حساب کاربری"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* منوی کشویی کاربر */}
              {isUserMenuOpen && (
                <div className="absolute left-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs text-slate-700 space-y-1">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900 truncate">
                      {session.user.name || "کاربر AI-Shop"}
                    </p>
                    <p className="text-[10px] text-slate-400 dir-ltr text-right font-medium">
                      {session.user.email}
                    </p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <UserRoundCog className="w-4 h-4 text-slate-500" />
                    <span>اطلاعات حساب</span>
                  </Link>

                  <Link
                    href="/profile/orders"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <Package className="w-4 h-4 text-slate-500" />
                    <span>سفارش‌های من</span>
                  </Link>

                  {session.user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 font-bold text-purple-700 transition-colors hover:bg-purple-50"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>پنل مدیریت</span>
                    </Link>
                  )}

                  <Link
                    href="/profile/wishlist"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <Heart className="w-4 h-4 text-slate-500" />
                    <span>علاقه‌مندی‌ها</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100 font-bold"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>خروج از حساب</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            
            /* حالت ۳: کاربر لاگین نکرده است */
            <Link
              href="/login"
              className="flex items-center gap-2 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <User className="w-4 h-4 text-slate-600" />
              <span>ورود | ثبت‌نام</span>
            </Link>
          )}

          <span className="w-[1px] h-6 bg-slate-200 hidden sm:block"></span>

          {/* آیکون سبد خرید */}
          <Link
            href="/cart"
            className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-700"
          >
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute top-0 left-0 flex min-w-4 h-4 items-center justify-center rounded-full bg-[#ef394e] px-1 text-[10px] font-bold text-white">
                {itemCount.toLocaleString("fa-IR")}
              </span>
            )}
          </Link>
        </div>
      </div>

      <form onSubmit={handleSearch} className="px-4 pb-3 sm:hidden">
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="جستجوی محصول..."
            aria-label="جستجوی محصولات"
            className="w-full rounded-xl border border-transparent bg-slate-100 py-2.5 pr-10 pl-4 text-xs text-slate-800 outline-none transition focus:border-[#ef394e] focus:bg-white focus:ring-2 focus:ring-[#ef394e]/20"
          />
          <button
            type="submit"
            aria-label="جستجو"
            className="absolute right-2 top-1.5 rounded-lg p-1.5 text-slate-400"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* بخش پایین هدر: منوی دسته‌بندی‌ها و لینک‌های سریع */}
      <div className="border-t border-slate-100">
        <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-6 py-2.5">
            
            {/* منوی دسته‌بندی کالاها */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen((open) => !open)}
                className="flex items-center gap-1 py-1 font-bold text-slate-900 transition hover:text-[#ef394e]"
              >
                <Menu className="w-4 h-4" />
                <span>دسته‌بندی کالاها</span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition ${
                    isCategoryMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isCategoryMenuOpen && (
                <div className="absolute top-full right-0 z-50 mt-3 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
                  <p className="px-2 pb-2 text-[10px] font-bold text-slate-400">
                    انتخاب دسته‌بندی
                  </p>
                  <div className="space-y-1">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/category/${category.slug}`}
                        onClick={() => setIsCategoryMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 font-bold text-slate-700 transition hover:bg-rose-50 hover:text-[#ef394e]"
                      >
                        <span>{category.name}</span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {category.productCount.toLocaleString("fa-IR")} کالا
                        </span>
                      </Link>
                    ))}
                    {categories.length === 0 && (
                      <p className="px-3 py-5 text-center text-xs text-slate-400">
                        دسته‌بندی‌ای ثبت نشده است.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className="hidden w-[1px] h-4 bg-slate-200 md:block"></span>

            {/* لینک‌های میانبر */}
            <Link
              href="/#amazing"
              className="hidden items-center gap-1.5 hover:text-[#ef394e] transition-colors md:flex"
            >
              <Flame className="w-4 h-4 text-orange-500" />
              <span>پیشنهادهای شگفت‌انگیز</span>
            </Link>

            <Link
              href="/#products"
              className="hidden items-center gap-1.5 hover:text-[#ef394e] transition-colors md:flex"
            >
              <Tag className="w-4 h-4 text-slate-400" />
              <span>پرفروش‌ترین‌ها</span>
            </Link>

            <Link
              href="/#amazing"
              className="hidden items-center gap-1.5 hover:text-[#ef394e] transition-colors text-purple-600 font-bold md:flex"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>تحلیل هوشمند AI</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

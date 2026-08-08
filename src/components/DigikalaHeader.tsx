'use client';

import { useState } from "react";
import Link from "next/link";
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
  Heart,
  Loader2,
} from "lucide-react";

export default function DigikalaHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { itemCount } = useCart();
  
  // دریافت وضعیت سشن کاربر از NextAuth
  const { data: session, status } = useSession();

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

          <div className="relative flex-1 hidden sm:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در میان محصولات و تحلیل‌های هوشمند..."
              className="w-full bg-slate-100 text-slate-800 text-xs py-2.5 pr-10 pl-4 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#ef394e]/20 focus:border-[#ef394e] border border-transparent transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          </div>
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
                    href="/profile/orders"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <Package className="w-4 h-4 text-slate-500" />
                    <span>سفارش‌های من</span>
                  </Link>

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

      {/* بخش پایین هدر: منوی دسته‌بندی‌ها و لینک‌های سریع */}
      <div className="border-t border-slate-100 hidden md:block">
        <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-6 py-2.5">
            
            {/* منوی دسته‌بندی کالاها */}
            <div className="flex items-center gap-1 text-slate-900 font-bold hover:text-[#ef394e] cursor-pointer py-1">
              <Menu className="w-4 h-4" />
              <span>دسته‌بندی کالاها</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>

            <span className="w-[1px] h-4 bg-slate-200"></span>

            {/* لینک‌های میانبر */}
            <Link
              href="#"
              className="flex items-center gap-1.5 hover:text-[#ef394e] transition-colors"
            >
              <Flame className="w-4 h-4 text-orange-500" />
              <span>پیشنهادهای شگفت‌انگیز</span>
            </Link>

            <Link
              href="#"
              className="flex items-center gap-1.5 hover:text-[#ef394e] transition-colors"
            >
              <Tag className="w-4 h-4 text-slate-400" />
              <span>پرفروش‌ترین‌ها</span>
            </Link>

            <Link
              href="#"
              className="flex items-center gap-1.5 hover:text-[#ef394e] transition-colors text-purple-600 font-bold"
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

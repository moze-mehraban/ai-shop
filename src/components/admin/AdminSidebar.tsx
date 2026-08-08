"use client";

import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  MessageSquareText,
  ShoppingBag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    href: "/admin",
    label: "داشبورد",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/products",
    label: "محصولات و دسته‌ها",
    icon: Boxes,
  },
  {
    href: "/admin/orders",
    label: "سفارش‌ها",
    icon: ShoppingBag,
  },
  {
    href: "/admin/users",
    label: "کاربران",
    icon: Users,
  },
  {
    href: "/admin/reviews",
    label: "دیدگاه‌ها",
    icon: MessageSquareText,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-slate-800 bg-slate-950 text-white lg:fixed lg:inset-y-0 lg:right-0 lg:w-72 lg:border-b-0 lg:border-l">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-5 py-5 lg:block lg:px-7 lg:py-8">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ef394e] shadow-lg shadow-rose-950/40">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="font-black">مدیریت AI-Shop</p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                مرکز کنترل فروشگاه
              </p>
            </div>
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-slate-500 hover:text-white lg:mt-5 lg:flex lg:w-full lg:justify-center"
          >
            مشاهده فروشگاه
          </Link>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:flex-col lg:overflow-visible lg:px-5 lg:pb-0">
          {navigationItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  isActive
                    ? "bg-white text-slate-950 shadow-lg shadow-black/20"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden p-5 lg:block">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs font-bold text-slate-200">راهنمای مدیریت</p>
            <p className="mt-2 text-[11px] leading-6 text-slate-500">
              قیمت، موجودی و وضعیت سفارش‌ها را همیشه پیش از انتشار بررسی کنید.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

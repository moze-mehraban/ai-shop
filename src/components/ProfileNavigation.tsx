"use client";

import { Heart, Package, UserRoundCog } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const profileLinks = [
  {
    href: "/profile",
    label: "اطلاعات حساب",
    icon: UserRoundCog,
  },
  {
    href: "/profile/orders",
    label: "سفارش‌های من",
    icon: Package,
  },
  {
    href: "/profile/wishlist",
    label: "علاقه‌مندی‌ها",
    icon: Heart,
  },
];

export default function ProfileNavigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1200px] gap-2 overflow-x-auto px-4 py-3">
        {profileLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CalendarDays,
  Heart,
  MessageSquareText,
  Package,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export const revalidate = 0;

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fprofile");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          orders: true,
          reviews: true,
          wishlist: true,
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
      <main className="mx-auto max-w-[1200px] px-4 py-8">
        <section className="mb-6 overflow-hidden rounded-[2rem] bg-slate-900 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white/10">
              <UserRound className="h-10 w-10 text-rose-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-rose-300">حساب کاربری من</p>
              <h1 className="mt-2 truncate text-2xl font-black">
                {user.name || "اطلاعات خود را تکمیل کنید"}
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                عضویت از {user.createdAt.toLocaleDateString("fa-IR")}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
              حساب تأییدشده با موبایل
            </div>
          </div>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <ProfileForm
            name={user.name || ""}
            email={user.email || ""}
            mobile={user.mobile || "ثبت نشده"}
          />

          <aside className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <AccountMetric icon={<Package className="h-5 w-5" />} value={user._count.orders} label="سفارش" />
              <AccountMetric icon={<Heart className="h-5 w-5" />} value={user._count.wishlist} label="علاقه‌مندی" />
              <AccountMetric icon={<MessageSquareText className="h-5 w-5" />} value={user._count.reviews} label="دیدگاه" />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-black text-slate-900">دسترسی سریع</h2>
              <div className="mt-4 space-y-2">
                <QuickLink href="/profile/orders" icon={<Package className="h-4 w-4" />} label="سفارش‌های من" />
                <QuickLink href="/profile/wishlist" icon={<Heart className="h-4 w-4" />} label="علاقه‌مندی‌ها" />
              </div>
            </div>

            {user.orders[0] && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-sky-500" />
                  <h2 className="font-black text-slate-900">آخرین سفارش</h2>
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  کد سفارش: {user.orders[0].id.slice(-8).toUpperCase()}
                </p>
                <p className="mt-2 text-lg font-black text-slate-900">
                  {user.orders[0].totalAmount.toLocaleString("fa-IR")} تومان
                </p>
                <Link href="/profile/orders" className="mt-4 block text-xs font-bold text-sky-600">
                  مشاهده جزئیات سفارش‌ها
                </Link>
              </div>
            )}
          </aside>
        </div>
      </main>
  );
}

function AccountMetric({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm">
      <div className="mx-auto flex w-fit text-[#ef394e]">{icon}</div>
      <p className="mt-2 text-lg font-black text-slate-900">{value.toLocaleString("fa-IR")}</p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-[#ef394e]">
      {icon}
      {label}
    </Link>
  );
}

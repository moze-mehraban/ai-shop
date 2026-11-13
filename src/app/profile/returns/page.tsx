import { authOptions } from "@/lib/auth";
import { RETURN_STATUS_LABELS, RETURN_STATUS_STYLES } from "@/lib/checkout";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, PackageOpen } from "lucide-react";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "مرجوعی‌های من" };

export default async function ReturnsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fprofile%2Freturns");

  const returns = await prisma.returnRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { orderItem: { select: { title: true, variantName: true } } } } },
  });

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <PackageOpen className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-black text-ink">مرجوعی‌های من</h1>
          <p className="text-xs text-slate-500">درخواست مرجوعی را از صفحه جزئیات سفارش تحویل‌شده ثبت کنید.</p>
        </div>
      </div>

      {returns.length === 0 ? (
        <div className="card rounded-2xl p-10 text-center text-sm text-slate-500">
          هنوز درخواست مرجوعی ثبت نکرده‌اید.
          <div className="mt-4">
            <Link href="/profile/orders" className="btn-ghost px-4 py-2 text-xs">مشاهده سفارش‌ها</Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {returns.map((request) => (
            <li key={request.id}>
              <Link
                href={`/profile/orders/${request.orderId}#returns`}
                className="card block rounded-2xl p-4 transition hover:border-brand-200 md:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>
                    سفارش <span dir="ltr" className="font-mono font-bold text-slate-700">{request.orderId.slice(-8).toUpperCase()}</span>
                    {" · "}
                    {request.createdAt.toLocaleDateString("fa-IR")}
                  </span>
                  <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${RETURN_STATUS_STYLES[request.status]}`}>
                    {RETURN_STATUS_LABELS[request.status]}
                  </span>
                </div>
                <p className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-700">
                  <span className="line-clamp-1">
                    {request.items.map((item) => `${item.orderItem.title ?? "کالا"} × ${item.quantity.toLocaleString("fa-IR")}`).join("، ")}
                  </span>
                  <ChevronLeft className="h-4 w-4 shrink-0 text-slate-400" />
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

import { authOptions } from "@/lib/auth";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/checkout";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, Package, ShoppingBag } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fprofile%2Forders");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: { include: { product: { select: { imageUrl: true, title: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Package className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-black text-ink">سفارش‌های من</h1>
          <p className="text-xs text-slate-500">تاریخچه و وضعیت پیگیری سفارش‌ها</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card space-y-4 rounded-2xl p-12 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="font-bold text-slate-800">هنوز سفارشی ثبت نکرده‌اید</h2>
          <Link href="/" className="btn-primary">
            شروع خرید
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/profile/orders/${order.id}`}
              className="card block rounded-2xl p-5 transition hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 text-xs">
                <div className="flex flex-wrap items-center gap-3 text-slate-500">
                  <span>
                    کد سفارش:{" "}
                    <strong className="font-mono text-slate-700" dir="ltr">
                      {order.id.slice(-8).toUpperCase()}
                    </strong>
                  </span>
                  <span>{order.createdAt.toLocaleDateString("fa-IR")}</span>
                </div>
                <span className={`rounded-lg border px-3 py-1 font-bold ${ORDER_STATUS_STYLES[order.status]}`}>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4">
                <div className="flex -space-x-2 space-x-reverse">
                  {order.items.slice(0, 5).map((item) => (
                    <span key={item.id} className="h-12 w-12 overflow-hidden rounded-xl border-2 border-white bg-slate-50">
                      {item.product.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.product.imageUrl} alt={item.title ?? item.product.title} className="h-full w-full object-contain p-1 mix-blend-multiply" />
                      )}
                    </span>
                  ))}
                </div>
                <span className="flex items-center gap-1 text-sm font-black text-ink">
                  {order.totalAmount.toLocaleString("fa-IR")} تومان
                  <ChevronLeft className="h-4 w-4 text-slate-400" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

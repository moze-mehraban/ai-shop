import { advanceOrderStatusAction, cancelOrderAction, updateOrderInfoAction } from "@/app/actions/adminActions";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES, RETURN_STATUS_LABELS, RETURN_STATUS_STYLES } from "@/lib/checkout";
import { getPaymentDeadlineHours, paymentDeadline } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";
import { ArrowRight, MapPin, Printer, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 0;

const NEXT_ACTION: Partial<Record<OrderStatus, string>> = {
  PENDING: "تأیید پرداخت",
  PAID: "ثبت ارسال",
  SHIPPED: "ثبت تحویل",
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, mobile: true, email: true, _count: { select: { orders: true } } } },
      items: { include: { product: { select: { id: true, title: true, imageUrl: true } } } },
      returns: { orderBy: { createdAt: "desc" }, select: { id: true, status: true, createdAt: true, reason: true } },
    },
  });
  const deadlineHours = await getPaymentDeadlineHours();

  if (!order) notFound();
  const code = order.id.slice(-8).toUpperCase();
  const payBy = order.status === "PENDING" ? paymentDeadline(order.createdAt, deadlineHours) : null;

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-600">
        <ArrowRight className="h-4 w-4" />
        بازگشت به سفارش‌ها
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-ink">
            سفارش <span dir="ltr" className="font-mono">{code}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {order.createdAt.toLocaleString("fa-IR", { dateStyle: "long", timeStyle: "short" })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${ORDER_STATUS_STYLES[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <Link href={`/admin/orders/${order.id}/invoice`} target="_blank" className="btn-ghost px-3 py-2 text-xs">
            <Printer className="h-4 w-4" />
            فاکتور / برچسب پستی
          </Link>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="card rounded-2xl p-5">
            <h2 className="mb-3 font-black text-ink">اقلام</h2>
            <ul className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3 text-sm">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                    {item.product.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product.imageUrl} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${item.product.id}`} className="line-clamp-1 font-bold text-ink hover:text-brand-700">
                      {item.title ?? item.product.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {item.variantName ? `${item.variantName} · ` : ""}
                      {item.quantity.toLocaleString("fa-IR")} × {item.price.toLocaleString("fa-IR")}
                    </p>
                  </div>
                  <span className="font-bold">{(item.price * item.quantity).toLocaleString("fa-IR")}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm">
              <div className="flex justify-between text-slate-500"><dt>جمع کالاها</dt><dd>{(order.subtotal || order.totalAmount).toLocaleString("fa-IR")}</dd></div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600"><dt>تخفیف ({order.couponCode})</dt><dd>− {order.discountAmount.toLocaleString("fa-IR")}</dd></div>
              )}
              <div className="flex justify-between text-slate-500"><dt>ارسال ({order.shippingMethod ?? "—"})</dt><dd>{order.shippingCost.toLocaleString("fa-IR")}</dd></div>
              <div className="flex justify-between font-black text-ink"><dt>مبلغ کل (تومان)</dt><dd>{order.totalAmount.toLocaleString("fa-IR")}</dd></div>
            </dl>
          </section>

          <section className="card grid gap-5 rounded-2xl p-5 md:grid-cols-2">
            <div>
              <h2 className="mb-2 flex items-center gap-2 font-black text-ink"><MapPin className="h-4 w-4 text-brand-600" />آدرس ارسال</h2>
              {order.address ? (
                <p className="text-sm leading-7 text-slate-600">
                  {order.recipientName} · <span dir="ltr">{order.recipientMobile}</span>
                  <br />
                  {order.province}، {order.city}
                  <br />
                  {order.address}
                  <br />
                  کد پستی: {order.postalCode}
                </p>
              ) : (
                <p className="text-sm text-slate-400">این سفارش قبل از افزودن آدرس ثبت شده است.</p>
              )}
              {order.customerNote && <p className="mt-2 rounded-xl bg-amber-50 p-2 text-xs text-amber-800">یادداشت مشتری: {order.customerNote}</p>}
            </div>
            <div>
              <h2 className="mb-2 flex items-center gap-2 font-black text-ink"><User className="h-4 w-4 text-brand-600" />حساب مشتری</h2>
              <p className="text-sm leading-7 text-slate-600">
                {order.user.name || "بدون نام"}
                <br />
                <span dir="ltr">{order.user.mobile}</span>
                <br />
                تعداد کل سفارش‌ها: {order.user._count.orders.toLocaleString("fa-IR")}
              </p>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card space-y-3 rounded-2xl p-5">
            <h2 className="font-black text-ink">تغییر وضعیت</h2>
            {NEXT_ACTION[order.status] && (
              <form action={advanceOrderStatusAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <AdminSubmitButton className="btn-primary w-full">{NEXT_ACTION[order.status]}</AdminSubmitButton>
              </form>
            )}
            {payBy && (
              <p className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-800">
                در صورت عدم تأیید پرداخت، سفارش در{" "}
                {payBy.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" })} خودکار لغو می‌شود.
              </p>
            )}
            {order.status === "CANCELED" && (
              <p className="rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600">
                لغو شده{order.canceledAt ? ` در ${order.canceledAt.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" })}` : ""}
                {order.cancelReason ? ` — ${order.cancelReason}` : ""}
              </p>
            )}
            {(order.status === "PENDING" || order.status === "PAID") && (
              <form action={cancelOrderAction} className="space-y-2">
                <input type="hidden" name="orderId" value={order.id} />
                <input name="reason" placeholder="دلیل لغو (به مشتری نمایش داده می‌شود)" className="field py-2 text-xs" />
                <AdminSubmitButton className="btn-ghost w-full text-rose-600" pendingLabel="در حال لغو...">
                  لغو سفارش و بازگرداندن موجودی
                </AdminSubmitButton>
              </form>
            )}
            {!NEXT_ACTION[order.status] && order.status !== "PENDING" && order.status !== "PAID" && (
              <p className="text-xs text-slate-500">این سفارش در وضعیت نهایی است.</p>
            )}
          </section>

          <section className="card rounded-2xl p-5">
            <form action={updateOrderInfoAction} className="space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600" htmlFor="trackingCode">کد رهگیری مرسوله</label>
                <input id="trackingCode" name="trackingCode" defaultValue={order.trackingCode ?? ""} dir="ltr" className="field py-2.5 text-right" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600" htmlFor="adminNote">یادداشت داخلی (فقط مدیر می‌بیند)</label>
                <textarea id="adminNote" name="adminNote" rows={3} defaultValue={order.adminNote ?? ""} className="field" />
              </div>
              <AdminSubmitButton className="btn-dark w-full py-2.5">ذخیره</AdminSubmitButton>
            </form>
          </section>

          {order.returns.length > 0 && (
            <section className="card space-y-2 rounded-2xl p-5">
              <h2 className="font-black text-ink">درخواست‌های مرجوعی</h2>
              {order.returns.map((request) => (
                <Link
                  key={request.id}
                  href={`/admin/returns/${request.id}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 text-xs hover:border-brand-300"
                >
                  <span className="line-clamp-1 text-slate-600">{request.reason}</span>
                  <span className={`shrink-0 rounded-lg border px-2 py-0.5 font-bold ${RETURN_STATUS_STYLES[request.status]}`}>
                    {RETURN_STATUS_LABELS[request.status]}
                  </span>
                </Link>
              ))}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

import { updateReturnStatusAction } from "@/app/actions/returnActions";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { RETURN_STATUS_LABELS, RETURN_STATUS_STYLES } from "@/lib/checkout";
import { prisma } from "@/lib/prisma";
import { ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 0;

export default async function AdminReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await prisma.returnRequest.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, mobile: true } },
      order: { select: { id: true, recipientName: true, recipientMobile: true, deliveredAt: true, totalAmount: true } },
      items: { include: { orderItem: { include: { product: { select: { id: true, imageUrl: true } } } } } },
    },
  });
  if (!request) notFound();

  const itemsValue = request.items.reduce((sum, item) => sum + item.orderItem.price * item.quantity, 0);
  const note = (placeholder: string) => (
    <textarea name="adminNote" rows={2} placeholder={placeholder} defaultValue="" className="field text-sm" />
  );

  return (
    <div className="space-y-6">
      <Link href="/admin/returns" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-600">
        <ArrowRight className="h-4 w-4" />
        بازگشت به مرجوعی‌ها
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-ink">درخواست مرجوعی</h1>
          <p className="mt-1 text-sm text-slate-500">
            سفارش{" "}
            <Link href={`/admin/orders/${request.order.id}`} className="font-mono font-bold text-brand-700 hover:underline" dir="ltr">
              {request.order.id.slice(-8).toUpperCase()}
            </Link>
            {" · "}ثبت در {request.createdAt.toLocaleString("fa-IR", { dateStyle: "long", timeStyle: "short" })}
          </p>
        </div>
        <span className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${RETURN_STATUS_STYLES[request.status]}`}>
          {RETURN_STATUS_LABELS[request.status]}
        </span>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="card rounded-2xl p-5">
            <h2 className="mb-3 font-black text-ink">اقلام مرجوعی</h2>
            <ul className="divide-y divide-slate-100">
              {request.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3 text-sm">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                    {item.orderItem.product.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.orderItem.product.imageUrl} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${item.orderItem.product.id}`} className="line-clamp-1 font-bold text-ink hover:text-brand-700">
                      {item.orderItem.title ?? "کالا"}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {item.orderItem.variantName ? `${item.orderItem.variantName} · ` : ""}
                      {item.quantity.toLocaleString("fa-IR")} از {item.orderItem.quantity.toLocaleString("fa-IR")} عدد خریداری‌شده
                    </p>
                  </div>
                  <span className="font-bold">{(item.orderItem.price * item.quantity).toLocaleString("fa-IR")}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
              ارزش اقلام مرجوعی: <strong className="text-ink">{itemsValue.toLocaleString("fa-IR")} تومان</strong>
            </p>
          </section>

          <section className="card rounded-2xl p-5 text-sm leading-7">
            <h2 className="mb-2 font-black text-ink">دلیل مشتری</h2>
            <p className="font-bold text-slate-700">{request.reason}</p>
            {request.description && <p className="mt-1 whitespace-pre-line text-slate-600">{request.description}</p>}
            {request.adminNote && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-slate-600">یادداشت فروشگاه: {request.adminNote}</p>}
            {request.restocked && <p className="mt-2 text-xs font-bold text-emerald-700">اقلام به موجودی انبار برگشت داده شده‌اند.</p>}
            {request.refundAmount !== null && (
              <p className="mt-2 text-xs font-bold text-emerald-700">مبلغ بازگشتی: {request.refundAmount.toLocaleString("fa-IR")} تومان</p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card rounded-2xl p-5 text-sm">
            <h2 className="mb-2 flex items-center gap-2 font-black text-ink">
              <User className="h-4 w-4 text-brand-600" />
              مشتری
            </h2>
            <p className="leading-7 text-slate-600">
              {request.order.recipientName || request.user.name || "—"}
              <br />
              <span dir="ltr">{request.order.recipientMobile || request.user.mobile}</span>
              {request.order.deliveredAt && (
                <>
                  <br />
                  تحویل: {request.order.deliveredAt.toLocaleDateString("fa-IR")}
                </>
              )}
            </p>
          </section>

          {request.status === "REQUESTED" && (
            <section className="card space-y-3 rounded-2xl p-5">
              <h2 className="font-black text-ink">بررسی درخواست</h2>
              <form action={updateReturnStatusAction} className="space-y-2">
                <input type="hidden" name="returnId" value={request.id} />
                <input type="hidden" name="status" value="APPROVED" />
                {note("یادداشت برای مشتری (مثلاً آدرس ارسال کالا)")}
                <AdminSubmitButton className="btn-primary w-full">تأیید مرجوعی</AdminSubmitButton>
              </form>
              <form action={updateReturnStatusAction} className="space-y-2 border-t border-slate-100 pt-3">
                <input type="hidden" name="returnId" value={request.id} />
                <input type="hidden" name="status" value="REJECTED" />
                {note("دلیل رد درخواست (به مشتری نمایش داده می‌شود)")}
                <AdminSubmitButton className="btn-ghost w-full text-rose-600" pendingLabel="در حال ثبت...">رد درخواست</AdminSubmitButton>
              </form>
            </section>
          )}

          {request.status === "APPROVED" && (
            <section className="card space-y-3 rounded-2xl p-5">
              <h2 className="font-black text-ink">دریافت کالا</h2>
              <form action={updateReturnStatusAction} className="space-y-3">
                <input type="hidden" name="returnId" value={request.id} />
                <input type="hidden" name="status" value="RECEIVED" />
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="restock" defaultChecked className="mt-1 h-4 w-4 accent-brand-500" />
                  برگرداندن اقلام به موجودی انبار (اگر کالا سالم و قابل فروش است)
                </label>
                {note("یادداشت (اختیاری)")}
                <AdminSubmitButton className="btn-primary w-full">ثبت دریافت کالا</AdminSubmitButton>
              </form>
              <form action={updateReturnStatusAction} className="border-t border-slate-100 pt-3">
                <input type="hidden" name="returnId" value={request.id} />
                <input type="hidden" name="status" value="REJECTED" />
                <AdminSubmitButton className="text-xs font-bold text-rose-600" pendingLabel="در حال ثبت...">لغو مرجوعی (کالا ارسال نشد)</AdminSubmitButton>
              </form>
            </section>
          )}

          {request.status === "RECEIVED" && (
            <section className="card space-y-3 rounded-2xl p-5">
              <h2 className="font-black text-ink">بازگرداندن وجه</h2>
              <form action={updateReturnStatusAction} className="space-y-3">
                <input type="hidden" name="returnId" value={request.id} />
                <input type="hidden" name="status" value="REFUNDED" />
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600" htmlFor="refundAmount">مبلغ بازگشتی (تومان)</label>
                  <input id="refundAmount" name="refundAmount" inputMode="numeric" defaultValue={itemsValue} className="field py-2.5" />
                </div>
                {note("یادداشت (مثلاً شماره پیگیری واریز)")}
                <AdminSubmitButton className="btn-primary w-full">ثبت بازگشت وجه</AdminSubmitButton>
              </form>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

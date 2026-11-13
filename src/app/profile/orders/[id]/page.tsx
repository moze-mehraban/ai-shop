import { authOptions } from "@/lib/auth";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES, RETURN_STATUS_LABELS, RETURN_STATUS_STYLES } from "@/lib/checkout";
import { getPaymentDeadlineHours, getReturnWindowDays, isInFuture, paymentDeadline } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { ArrowRight, Check, CheckCircle2, Clock, FileText, MapPin, PackageOpen, Truck, XCircle } from "lucide-react";
import OrderPaymentBox from "./OrderPaymentBox";
import ReturnRequestForm from "./ReturnRequestForm";
import { getServerSession } from "next-auth";
import { productHref } from "@/lib/slug";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

const STEPS = ["PENDING", "PAID", "SHIPPED", "DELIVERED"] as const;

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const [{ id }, { placed }] = await Promise.all([params, searchParams]);
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/profile/orders/${id}`)}`);
  }

  const [order, settings, deadlineHours, returnDays] = await Promise.all([
    prisma.order.findFirst({
      where: { id, userId: session.user.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, slug: true, title: true, imageUrl: true } },
            returnItems: { where: { request: { status: { not: "REJECTED" } } }, select: { quantity: true } },
          },
        },
        returns: {
          orderBy: { createdAt: "desc" },
          include: { items: { include: { orderItem: { select: { title: true, variantName: true } } } } },
        },
      },
    }),
    getSettings(),
    getPaymentDeadlineHours(),
    getReturnWindowDays(),
  ]);

  if (!order) notFound();

  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const code = order.id.slice(-8).toUpperCase();
  const formatDateTime = (date: Date) => date.toLocaleString("fa-IR", { dateStyle: "long", timeStyle: "short" });

  // مهلت پرداخت (برای سفارش در انتظار پرداخت)
  // سفارشی که رسید پرداخت دارد خودکار لغو نمی‌شود، پس مهلت پرداخت نمایش داده نمی‌شود
  const payBy =
    order.status === "PENDING" && !order.receiptUploadedAt ? paymentDeadline(order.createdAt, deadlineHours) : null;

  // مهلت مرجوعی (برای سفارش تحویل‌شده)
  const deliveredAt = order.deliveredAt ?? (order.status === "DELIVERED" ? order.updatedAt : null);
  const returnUntil =
    order.status === "DELIVERED" && deliveredAt && returnDays > 0
      ? new Date(deliveredAt.getTime() + returnDays * 24 * 60 * 60 * 1000)
      : null;
  const returnableItems = order.items.map((item) => ({
    id: item.id,
    title: item.title ?? item.product.title,
    variantName: item.variantName,
    imageUrl: item.product.imageUrl,
    returnable: Math.max(0, item.quantity - item.returnItems.reduce((sum, returned) => sum + returned.quantity, 0)),
  }));
  const canRequestReturn =
    returnUntil !== null && isInFuture(returnUntil) && returnableItems.some((item) => item.returnable > 0);

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-8">
      <Link href="/profile/orders" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-600">
        <ArrowRight className="h-4 w-4" />
        بازگشت به سفارش‌ها
      </Link>

      {placed && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-black">سفارش شما با کد {code} ثبت شد.</p>
            <p className="mt-1 leading-7">
              {settings.cardNumber
                ? "برای تکمیل سفارش، مبلغ را کارت‌به‌کارت کنید و تصویر رسید را در بخش «پرداخت سفارش» همین صفحه بفرستید."
                : "وضعیت سفارش از همین صفحه قابل پیگیری است."}
              {!settings.cardNumber && settings.phone && <> برای هماهنگی پرداخت با شماره <span dir="ltr">{settings.phone}</span> تماس بگیرید.</>}
            </p>
          </div>
        </div>
      )}

      <section className="card rounded-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-black text-ink">
              سفارش <span dir="ltr" className="font-mono">{code}</span>
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              ثبت‌شده در {order.createdAt.toLocaleDateString("fa-IR", { dateStyle: "long" })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {order.status !== "CANCELED" && (
              <Link href={`/profile/orders/${order.id}/invoice`} className="btn-ghost px-3 py-1.5 text-xs">
                <FileText className="h-4 w-4" />
                فاکتور
              </Link>
            )}
            <span className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${ORDER_STATUS_STYLES[order.status]}`}>
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>
        </div>

        {order.status !== "CANCELED" && (
          <ol className="mt-6 grid grid-cols-4 gap-2">
            {STEPS.map((step, index) => (
              <li key={step} className="text-center">
                <span
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    index <= stepIndex ? "bg-brand-400 text-brand-900" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {index < stepIndex ? <Check className="h-4 w-4" /> : (index + 1).toLocaleString("fa-IR")}
                </span>
                <span className={`mt-2 block text-[11px] leading-5 ${index <= stepIndex ? "font-bold text-ink" : "text-slate-400"}`}>
                  {ORDER_STATUS_LABELS[step]}
                </span>
              </li>
            ))}
          </ol>
        )}

        {payBy && (
          <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-7 text-amber-800">
            <Clock className="mt-1 h-4 w-4 shrink-0" />
            <span>
              مهلت پرداخت این سفارش تا <strong>{formatDateTime(payBy)}</strong> است. اگر تا آن زمان پرداخت انجام نشود، سفارش خودکار لغو
              می‌شود.
            </span>
          </p>
        )}

        {order.status === "CANCELED" && (
          <p className="mt-5 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-7 text-slate-600">
            <XCircle className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
            <span>
              این سفارش {order.canceledAt ? `در ${formatDateTime(order.canceledAt)} ` : ""}لغو شد.
              {order.cancelReason && <> دلیل: {order.cancelReason}</>}
            </span>
          </p>
        )}

        {order.trackingCode && (
          <p className="mt-5 flex items-center gap-2 rounded-xl bg-ai-50 p-3 text-sm text-ai-700">
            <Truck className="h-4 w-4" />
            کد رهگیری مرسوله: <strong dir="ltr" className="font-mono">{order.trackingCode}</strong>
          </p>
        )}
      </section>

      {order.status === "PENDING" && (
        <OrderPaymentBox
          orderId={order.id}
          amount={order.totalAmount}
          card={
            settings.cardNumber
              ? { number: settings.cardNumber, holder: settings.cardHolder, bank: settings.cardBank }
              : null
          }
          receipt={
            order.receiptPath && order.receiptUploadedAt
              ? {
                  uploadedAt: order.receiptUploadedAt.toISOString(),
                  reference: order.receiptRef,
                  rejectNote: order.receiptRejectNote,
                }
              : null
          }
        />
      )}

      <section className="card rounded-2xl p-5 md:p-6">
        <h2 className="mb-4 font-black text-ink">اقلام سفارش</h2>
        <ul className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                {item.product.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.product.imageUrl} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />
                )}
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <Link href={productHref(item.product)} className="line-clamp-1 font-bold text-ink hover:text-brand-700">
                  {item.title ?? item.product.title}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500">
                  {item.variantName ? `${item.variantName} · ` : ""}
                  {item.quantity.toLocaleString("fa-IR")} × {item.price.toLocaleString("fa-IR")} تومان
                </p>
              </div>
              <span className="text-sm font-bold text-slate-700">
                {(item.price * item.quantity).toLocaleString("fa-IR")}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between text-slate-500">
            <dt>جمع کالاها</dt>
            <dd>{(order.subtotal || order.totalAmount).toLocaleString("fa-IR")} تومان</dd>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <dt>تخفیف {order.couponCode ? `(${order.couponCode})` : ""}</dt>
              <dd>− {order.discountAmount.toLocaleString("fa-IR")} تومان</dd>
            </div>
          )}
          <div className="flex justify-between text-slate-500">
            <dt>هزینه ارسال {order.shippingMethod ? `(${order.shippingMethod})` : ""}</dt>
            <dd>{order.shippingCost > 0 ? `${order.shippingCost.toLocaleString("fa-IR")} تومان` : "رایگان"}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-3 font-black text-ink">
            <dt>مبلغ کل</dt>
            <dd>{order.totalAmount.toLocaleString("fa-IR")} تومان</dd>
          </div>
        </dl>
      </section>

      {(order.returns.length > 0 || canRequestReturn) && (
        <section id="returns" className="card scroll-mt-32 rounded-2xl p-5 md:p-6">
          <h2 className="mb-4 flex items-center gap-2 font-black text-ink">
            <PackageOpen className="h-5 w-5 text-brand-600" />
            مرجوعی
          </h2>

          {order.returns.length > 0 && (
            <ul className="mb-5 space-y-3">
              {order.returns.map((request) => (
                <li key={request.id} className="rounded-xl border border-slate-200 p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">ثبت‌شده در {request.createdAt.toLocaleDateString("fa-IR", { dateStyle: "long" })}</span>
                    <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${RETURN_STATUS_STYLES[request.status]}`}>
                      {RETURN_STATUS_LABELS[request.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-700">
                    {request.items
                      .map((item) => `${item.orderItem.title ?? "کالا"}${item.orderItem.variantName ? ` (${item.orderItem.variantName})` : ""} × ${item.quantity.toLocaleString("fa-IR")}`)
                      .join("، ")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">دلیل: {request.reason}{request.description ? ` — ${request.description}` : ""}</p>
                  {request.adminNote && (
                    <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs leading-6 text-slate-600">پاسخ فروشگاه: {request.adminNote}</p>
                  )}
                  {request.status === "REFUNDED" && request.refundAmount !== null && (
                    <p className="mt-2 text-xs font-bold text-emerald-700">
                      مبلغ بازگشتی: {request.refundAmount.toLocaleString("fa-IR")} تومان
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canRequestReturn && returnUntil && (
            <ReturnRequestForm
              orderId={order.id}
              items={returnableItems}
              deadlineLabel={returnUntil.toLocaleDateString("fa-IR", { dateStyle: "long" })}
            />
          )}
        </section>
      )}

      {order.address && (
        <section className="card rounded-2xl p-5 md:p-6">
          <h2 className="mb-3 flex items-center gap-2 font-black text-ink">
            <MapPin className="h-5 w-5 text-brand-600" />
            اطلاعات ارسال
          </h2>
          <p className="text-sm leading-8 text-slate-600">
            {order.province}، {order.city}، {order.address}
            <br />
            کد پستی: {order.postalCode} · گیرنده: {order.recipientName} ·{" "}
            <span dir="ltr">{order.recipientMobile}</span>
          </p>
          {order.customerNote && <p className="mt-2 text-xs text-slate-500">توضیحات: {order.customerNote}</p>}
        </section>
      )}
    </main>
  );
}

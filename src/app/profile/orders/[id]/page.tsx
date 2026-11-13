import { authOptions } from "@/lib/auth";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/checkout";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { ArrowRight, Check, CheckCircle2, MapPin, Truck } from "lucide-react";
import { getServerSession } from "next-auth";
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

  const [order, settings] = await Promise.all([
    prisma.order.findFirst({
      where: { id, userId: session.user.id },
      include: {
        items: { include: { product: { select: { id: true, title: true, imageUrl: true } } } },
      },
    }),
    getSettings(),
  ]);

  if (!order) notFound();

  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const code = order.id.slice(-8).toUpperCase();

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
              وضعیت سفارش از همین صفحه قابل پیگیری است.
              {settings.phone && <> برای هماهنگی پرداخت با شماره <span dir="ltr">{settings.phone}</span> تماس بگیرید.</>}
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
          <span className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${ORDER_STATUS_STYLES[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
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

        {order.trackingCode && (
          <p className="mt-5 flex items-center gap-2 rounded-xl bg-ai-50 p-3 text-sm text-ai-700">
            <Truck className="h-4 w-4" />
            کد رهگیری مرسوله: <strong dir="ltr" className="font-mono">{order.trackingCode}</strong>
          </p>
        )}
      </section>

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
                <Link href={`/product/${item.product.id}`} className="line-clamp-1 font-bold text-ink hover:text-brand-700">
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

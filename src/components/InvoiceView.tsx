import { ORDER_STATUS_LABELS } from "@/lib/checkout";
import type { SiteSettings } from "@/lib/settings";
import type { Order, OrderItem } from "@prisma/client";

type InvoiceOrder = Order & { items: (OrderItem & { product: { title: string } })[] };

// فاکتور فروش؛ مشترک بین پنل مدیریت (با برچسب پستی) و حساب مشتری
export default function InvoiceView({
  order,
  settings,
  showShippingLabel = false,
}: {
  order: InvoiceOrder;
  settings: SiteSettings;
  showShippingLabel?: boolean;
}) {
  const code = order.id.slice(-8).toUpperCase();
  const cell = "border border-slate-300 p-2";

  return (
    <div className="space-y-6 bg-white text-sm text-black">
      {showShippingLabel && (
        <section className="rounded-xl border-2 border-dashed border-slate-400 p-4">
          <p className="mb-2 font-black">گیرنده</p>
          <p className="leading-7">
            {order.recipientName} — <span dir="ltr">{order.recipientMobile}</span>
            <br />
            {order.province}، {order.city}، {order.address}
            <br />
            کد پستی: <strong>{order.postalCode}</strong>
          </p>
          <p className="mt-3 border-t border-slate-300 pt-2 text-xs">
            فرستنده: {settings.shopName}
            {settings.phone && <> — <span dir="ltr">{settings.phone}</span></>}
            {settings.address && <> — {settings.address}</>}
          </p>
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-300 pb-3">
          <div>
            <h1 className="text-lg font-black">فاکتور فروش {settings.shopName}</h1>
            <p className="mt-1 text-xs leading-6 text-slate-600">
              {settings.address && <>{settings.address}<br /></>}
              {settings.phone && <>تلفن: <span dir="ltr">{settings.phone}</span></>}
            </p>
          </div>
          <p className="text-left text-xs leading-6">
            شماره فاکتور: <span dir="ltr" className="font-mono font-bold">{code}</span>
            <br />
            تاریخ: {order.createdAt.toLocaleDateString("fa-IR")}
            <br />
            وضعیت: {ORDER_STATUS_LABELS[order.status]}
          </p>
        </div>

        {order.recipientName && (
          <p className="mb-3 text-xs leading-6">
            خریدار: <strong>{order.recipientName}</strong> · <span dir="ltr">{order.recipientMobile}</span>
            <br />
            آدرس: {order.province}، {order.city}، {order.address} · کد پستی: {order.postalCode}
          </p>
        )}

        <table className="w-full border-collapse text-right">
          <thead>
            <tr className="bg-slate-100">
              <th className={cell}>ردیف</th>
              <th className={cell}>شرح کالا</th>
              <th className={cell}>تعداد</th>
              <th className={cell}>فی (تومان)</th>
              <th className={cell}>جمع (تومان)</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={item.id}>
                <td className={cell}>{(index + 1).toLocaleString("fa-IR")}</td>
                <td className={cell}>
                  {item.title ?? item.product.title}
                  {item.variantName ? ` (${item.variantName})` : ""}
                </td>
                <td className={cell}>{item.quantity.toLocaleString("fa-IR")}</td>
                <td className={cell}>{item.price.toLocaleString("fa-IR")}</td>
                <td className={cell}>{(item.price * item.quantity).toLocaleString("fa-IR")}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={4} className={cell}>جمع کالاها</td><td className={cell}>{(order.subtotal || order.totalAmount).toLocaleString("fa-IR")}</td></tr>
            {order.discountAmount > 0 && (
              <tr><td colSpan={4} className={cell}>تخفیف{order.couponCode ? ` (${order.couponCode})` : ""}</td><td className={cell}>{order.discountAmount.toLocaleString("fa-IR")}</td></tr>
            )}
            <tr><td colSpan={4} className={cell}>هزینه ارسال{order.shippingMethod ? ` (${order.shippingMethod})` : ""}</td><td className={cell}>{order.shippingCost.toLocaleString("fa-IR")}</td></tr>
            <tr className="font-black"><td colSpan={4} className={cell}>مبلغ نهایی</td><td className={cell}>{order.totalAmount.toLocaleString("fa-IR")}</td></tr>
          </tfoot>
        </table>
      </section>
    </div>
  );
}

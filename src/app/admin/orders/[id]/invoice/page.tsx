import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

export const revalidate = 0;

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: { select: { title: true } } } } },
    }),
    getSettings(),
  ]);

  if (!order) notFound();
  const code = order.id.slice(-8).toUpperCase();
  const cell = "border border-slate-300 p-2";

  return (
    <div className="mx-auto max-w-3xl space-y-6 bg-white p-6 text-sm text-black print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <p className="text-slate-500">پیش‌نمایش چاپ</p>
        <PrintButton />
      </div>

      {/* برچسب پستی */}
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

      {/* فاکتور */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h1 className="text-lg font-black">فاکتور فروش {settings.shopName}</h1>
          <p className="text-xs">
            شماره: <span dir="ltr">{code}</span> · تاریخ: {order.createdAt.toLocaleDateString("fa-IR")}
          </p>
        </div>
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
              <tr><td colSpan={4} className={cell}>تخفیف</td><td className={cell}>{order.discountAmount.toLocaleString("fa-IR")}</td></tr>
            )}
            <tr><td colSpan={4} className={cell}>هزینه ارسال</td><td className={cell}>{order.shippingCost.toLocaleString("fa-IR")}</td></tr>
            <tr className="font-black"><td colSpan={4} className={cell}>مبلغ نهایی</td><td className={cell}>{order.totalAmount.toLocaleString("fa-IR")}</td></tr>
          </tfoot>
        </table>
      </section>
    </div>
  );
}

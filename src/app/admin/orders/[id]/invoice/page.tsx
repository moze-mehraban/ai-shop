import InvoiceView from "@/components/InvoiceView";
import PrintButton from "@/components/PrintButton";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { notFound } from "next/navigation";

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

  return (
    <div className="mx-auto max-w-3xl space-y-6 bg-white p-6 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <p className="text-sm text-slate-500">پیش‌نمایش چاپ</p>
        <PrintButton />
      </div>
      <InvoiceView order={order} settings={settings} showShippingLabel />
    </div>
  );
}

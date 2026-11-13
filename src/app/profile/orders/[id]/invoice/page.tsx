import InvoiceView from "@/components/InvoiceView";
import PrintButton from "@/components/PrintButton";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = { title: "فاکتور سفارش", robots: { index: false } };

export default async function CustomerInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/profile/orders/${id}/invoice`)}`);

  const [order, settings] = await Promise.all([
    prisma.order.findFirst({
      where: { id, userId: session.user.id },
      include: { items: { include: { product: { select: { title: true } } } } },
    }),
    getSettings(),
  ]);
  if (!order || order.status === "CANCELED") notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-8 print:max-w-none print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/profile/orders/${order.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-600">
          <ArrowRight className="h-4 w-4" />
          بازگشت به سفارش
        </Link>
        <PrintButton variant="pdf" />
      </div>
      <p className="rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-500 print:hidden">
        در پنجره‌ای که باز می‌شود، مقصد را «Save as PDF» یا «ذخیره به‌صورت PDF» انتخاب کنید.
      </p>
      <div className="card rounded-2xl p-6 print:border-0 print:p-0 print:shadow-none">
        <InvoiceView order={order} settings={settings} />
      </div>
    </main>
  );
}

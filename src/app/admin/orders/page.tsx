import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/checkout";
import { normalizeDigits } from "@/lib/digits";
import { expireUnpaidOrders } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import type { OrderStatus, Prisma } from "@prisma/client";
import { Search } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

const PAGE_SIZE = 30;
const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await expireUnpaidOrders();
  const params = await searchParams;
  const status = STATUSES.includes(params.status as OrderStatus) ? (params.status as OrderStatus) : undefined;
  const q = normalizeDigits(String(params.q ?? "")).trim().slice(0, 60);
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.OrderWhereInput = {
    AND: [
      status ? { status } : {},
      q
        ? {
            OR: [
              { id: { endsWith: q.toLowerCase() } },
              { recipientMobile: { contains: q } },
              { recipientName: { contains: q } },
              { trackingCode: { contains: q } },
              { user: { is: { mobile: { contains: q } } } },
            ],
          }
        : {},
    ],
  };

  const [orders, total, counts] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, mobile: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countFor = (value: OrderStatus) => counts.find((row) => row.status === value)?._count._all ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (changes: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    const merged = { status, q: q || undefined, page: undefined as string | undefined, ...changes };
    for (const [key, value] of Object.entries(merged)) if (value) search.set(key, value);
    return `/admin/orders?${search.toString()}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-ink md:text-3xl">سفارش‌ها</h1>

      <div className="flex flex-wrap gap-2">
        <Link href={href({ status: undefined })} className={`rounded-full px-4 py-2 text-xs font-bold ${!status ? "bg-ink text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
          همه
        </Link>
        {STATUSES.map((value) => (
          <Link
            key={value}
            href={href({ status: value })}
            className={`rounded-full px-4 py-2 text-xs font-bold ${status === value ? "bg-ink text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {ORDER_STATUS_LABELS[value]} ({countFor(value).toLocaleString("fa-IR")})
          </Link>
        ))}
      </div>

      <form className="card flex gap-2 rounded-2xl p-3">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={q} placeholder="کد سفارش، موبایل، نام گیرنده یا کد رهگیری" className="field py-2.5 pr-9" />
        </div>
        <button type="submit" className="btn-dark py-2.5">جستجو</button>
      </form>

      <div className="card overflow-hidden rounded-2xl">
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="p-3 font-bold">کد</th>
                <th className="p-3 font-bold">مشتری</th>
                <th className="p-3 font-bold">تاریخ</th>
                <th className="p-3 font-bold">اقلام</th>
                <th className="p-3 font-bold">مبلغ (تومان)</th>
                <th className="p-3 font-bold">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/70">
                  <td className="p-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-mono font-bold text-brand-700 hover:underline" dir="ltr">
                      {order.id.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="p-3">
                    <span className="block font-bold text-ink">{order.recipientName || order.user.name || "—"}</span>
                    <span className="text-xs text-slate-400" dir="ltr">{order.recipientMobile || order.user.mobile}</span>
                  </td>
                  <td className="p-3 text-slate-600">{order.createdAt.toLocaleDateString("fa-IR")}</td>
                  <td className="p-3 text-slate-600">{order._count.items.toLocaleString("fa-IR")}</td>
                  <td className="p-3 font-bold">{order.totalAmount.toLocaleString("fa-IR")}</td>
                  <td className="p-3">
                    <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${ORDER_STATUS_STYLES[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    {order.status === "PENDING" && order.receiptPath && !order.receiptRejectNote && (
                      <span className="mr-1 rounded-lg bg-sky-50 px-2 py-1 text-[11px] font-bold text-sky-700">رسید ارسال شده</span>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">سفارشی پیدا نشد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pageCount > 1 && (
        <nav className="flex justify-center gap-2 text-sm">
          {page > 1 && <Link href={href({ page: String(page - 1) })} className="btn-ghost px-4 py-2">قبلی</Link>}
          <span className="px-3 py-2 text-slate-500">صفحه {page.toLocaleString("fa-IR")} از {pageCount.toLocaleString("fa-IR")}</span>
          {page < pageCount && <Link href={href({ page: String(page + 1) })} className="btn-ghost px-4 py-2">بعدی</Link>}
        </nav>
      )}
    </div>
  );
}

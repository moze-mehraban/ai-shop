import { RETURN_STATUS_LABELS, RETURN_STATUS_STYLES } from "@/lib/checkout";
import { prisma } from "@/lib/prisma";
import type { ReturnStatus } from "@prisma/client";
import Link from "next/link";

export const revalidate = 0;

const STATUSES = Object.keys(RETURN_STATUS_LABELS) as ReturnStatus[];

export default async function AdminReturnsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: rawStatus } = await searchParams;
  const status = STATUSES.includes(rawStatus as ReturnStatus) ? (rawStatus as ReturnStatus) : undefined;

  const [returns, counts] = await Promise.all([
    prisma.returnRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { name: true, mobile: true } },
        order: { select: { recipientName: true, recipientMobile: true } },
        items: { select: { quantity: true } },
      },
    }),
    prisma.returnRequest.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countFor = (value: ReturnStatus) => counts.find((row) => row.status === value)?._count._all ?? 0;
  const tab = (active: boolean) =>
    `rounded-full px-4 py-2 text-xs font-bold ${active ? "bg-ink text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-ink md:text-3xl">مرجوعی‌ها</h1>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/returns" className={tab(!status)}>همه</Link>
        {STATUSES.map((value) => (
          <Link key={value} href={`/admin/returns?status=${value}`} className={tab(status === value)}>
            {RETURN_STATUS_LABELS[value]} ({countFor(value).toLocaleString("fa-IR")})
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden rounded-2xl">
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="p-3 font-bold">سفارش</th>
                <th className="p-3 font-bold">مشتری</th>
                <th className="p-3 font-bold">تاریخ</th>
                <th className="p-3 font-bold">اقلام</th>
                <th className="p-3 font-bold">دلیل</th>
                <th className="p-3 font-bold">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returns.map((request) => (
                <tr key={request.id} className="hover:bg-slate-50/70">
                  <td className="p-3">
                    <Link href={`/admin/returns/${request.id}`} className="font-mono font-bold text-brand-700 hover:underline" dir="ltr">
                      {request.orderId.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="p-3">
                    <span className="block font-bold text-ink">{request.order.recipientName || request.user.name || "—"}</span>
                    <span className="text-xs text-slate-400" dir="ltr">{request.order.recipientMobile || request.user.mobile}</span>
                  </td>
                  <td className="p-3 text-slate-600">{request.createdAt.toLocaleDateString("fa-IR")}</td>
                  <td className="p-3 text-slate-600">
                    {request.items.reduce((sum, item) => sum + item.quantity, 0).toLocaleString("fa-IR")} عدد
                  </td>
                  <td className="max-w-56 truncate p-3 text-slate-600">{request.reason}</td>
                  <td className="p-3">
                    <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${RETURN_STATUS_STYLES[request.status]}`}>
                      {RETURN_STATUS_LABELS[request.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {returns.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">درخواستی پیدا نشد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

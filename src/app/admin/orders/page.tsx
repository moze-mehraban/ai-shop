import { updateOrderStatusAction } from "@/app/actions/adminActions";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";
import {
  CheckCircle2,
  Clock3,
  Package,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

const statusConfig: Record<
  OrderStatus,
  { label: string; className: string; icon: typeof Clock3 }
> = {
  PENDING: {
    label: "در انتظار پرداخت",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock3,
  },
  PAID: {
    label: "پرداخت‌شده",
    className: "bg-sky-50 text-sky-700 border-sky-200",
    icon: CheckCircle2,
  },
  SHIPPED: {
    label: "ارسال‌شده",
    className: "bg-purple-50 text-purple-700 border-purple-200",
    icon: Truck,
  },
  DELIVERED: {
    label: "تحویل‌شده",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: Package,
  },
  CANCELED: {
    label: "لغوشده",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  },
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const selectedStatus =
    status && status in statusConfig ? (status as OrderStatus) : undefined;

  const [orders, orderCount, pendingCount] = await Promise.all([
    prisma.order.findMany({
      where: selectedStatus ? { status: selectedStatus } : undefined,
      include: {
        user: {
          select: {
            name: true,
            mobile: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#ef394e]">عملیات فروش</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">
            مدیریت سفارش‌ها
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            وضعیت پرداخت، ارسال و تحویل سفارش‌ها را کنترل کنید.
          </p>
        </div>
        <div className="flex gap-3">
          <StatBadge
            label="کل سفارش‌ها"
            value={orderCount.toLocaleString("fa-IR")}
          />
          <StatBadge
            label="در انتظار"
            value={pendingCount.toLocaleString("fa-IR")}
            warning
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterLink href="/admin/orders" active={!selectedStatus}>
          همه
        </FilterLink>
        {(Object.keys(statusConfig) as OrderStatus[]).map((orderStatus) => (
          <FilterLink
            key={orderStatus}
            href={`/admin/orders?status=${orderStatus}`}
            active={selectedStatus === orderStatus}
          >
            {statusConfig[orderStatus].label}
          </FilterLink>
        ))}
      </div>

      <section className="space-y-4">
        {orders.map((order) => {
          const config = statusConfig[order.status];
          const StatusIcon = config.icon;

          return (
            <article
              key={order.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-black text-slate-900">
                      سفارش #{order.id.slice(-8).toUpperCase()}
                    </h2>
                    <span
                      className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black ${config.className}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {config.label}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {order.user.name ||
                      order.user.mobile ||
                      order.user.email ||
                      "کاربر بدون نام"}{" "}
                    • {order.createdAt.toLocaleString("fa-IR")}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-lg font-black text-slate-900">
                    {order.totalAmount.toLocaleString("fa-IR")}
                  </p>
                  <p className="text-[10px] text-slate-400">تومان</p>
                </div>
              </div>

              <div className="grid gap-5 pt-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-700">
                          {item.product.title}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          تعداد {item.quantity.toLocaleString("fa-IR")}
                        </p>
                      </div>
                      <span className="shrink-0 font-black text-slate-700">
                        {(item.price * item.quantity).toLocaleString("fa-IR")}{" "}
                        تومان
                      </span>
                    </div>
                  ))}
                </div>

                <form
                  action={updateOrderStatusAction}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <input type="hidden" name="orderId" value={order.id} />
                  <label className="text-xs font-bold text-slate-600">
                    تغییر وضعیت سفارش
                    <select
                      name="status"
                      defaultValue={order.status}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-[#ef394e]"
                    >
                      {(Object.keys(statusConfig) as OrderStatus[]).map(
                        (orderStatus) => (
                          <option key={orderStatus} value={orderStatus}>
                            {statusConfig[orderStatus].label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <AdminSubmitButton
                    className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
                    pendingLabel="در حال بروزرسانی..."
                  >
                    ذخیره وضعیت
                  </AdminSubmitButton>
                </form>
              </div>
            </article>
          );
        })}

        {orders.length === 0 && (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white text-center">
            <ShoppingBag className="h-10 w-10 text-slate-300" />
            <h2 className="mt-4 font-black text-slate-700">
              سفارشی در این وضعیت نیست
            </h2>
          </div>
        )}
      </section>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
        active
          ? "bg-slate-900 text-white"
          : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300"
      }`}
    >
      {children}
    </Link>
  );
}

function StatBadge({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-2.5 ${
        warning
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-[10px] text-slate-400">{label}</p>
      <p
        className={`mt-0.5 font-black ${
          warning ? "text-amber-700" : "text-slate-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

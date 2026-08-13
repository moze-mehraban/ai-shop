import { prisma } from "@/lib/prisma";
import {
  AlertTriangle,
  ArrowUpLeft,
  Boxes,
  CircleDollarSign,
  MessageSquareText,
  PackageCheck,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

const orderStatusLabels = {
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  CANCELED: "لغوشده",
} as const;

export default async function AdminDashboardPage() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    productCount,
    userCount,
    orderCount,
    reviewCount,
    lowStockProducts,
    recentOrders,
    revenueAggregate,
    monthlyRevenueAggregate,
    ratingAggregate,
    statusGroups,
    topOrderItems,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.count(),
    prisma.review.count(),
    prisma.product.findMany({
      where: { stock: { lte: 5 } },
      orderBy: { stock: "asc" },
      take: 6,
      select: {
        id: true,
        title: true,
        stock: true,
      },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        user: {
          select: {
            name: true,
            mobile: true,
            email: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
    }),
    prisma.order.aggregate({
      where: { status: { not: "CANCELED" } },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: {
        status: { not: "CANCELED" },
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { totalAmount: true },
    }),
    prisma.review.aggregate({
      _avg: { rating: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          status: {
            not: "CANCELED",
          },
        },
      },
      _sum: { quantity: true },
      orderBy: {
        _sum: { quantity: "desc" },
      },
      take: 5,
    }),
  ]);

  const topProducts = await prisma.product.findMany({
    where: {
      id: {
        in: topOrderItems.map((item) => item.productId),
      },
    },
    select: {
      id: true,
      title: true,
    },
  });
  const productTitleMap = new Map(
    topProducts.map((product) => [product.id, product.title]),
  );
  const maxStatusCount = Math.max(
    1,
    ...statusGroups.map((group) => group._count._all),
  );

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-bold text-[#ef394e]">نمای کلی فروشگاه</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              داشبورد مدیریت
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              مهم‌ترین آمار فروش، سفارش‌ها و عملکرد فروشگاه در یک نگاه
            </p>
          </div>
          <span className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500">
            ۳۰ روز اخیر:{" "}
            {(monthlyRevenueAggregate._sum.totalAmount ?? 0).toLocaleString(
              "fa-IR",
            )}{" "}
            تومان
          </span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="درآمد کل"
          value={`${(revenueAggregate._sum.totalAmount ?? 0).toLocaleString("fa-IR")} تومان`}
          subtitle="بدون سفارش‌های لغوشده"
          icon={<CircleDollarSign className="h-6 w-6" />}
          color="bg-emerald-50 text-emerald-700"
        />
        <SummaryCard
          title="سفارش‌ها"
          value={orderCount.toLocaleString("fa-IR")}
          subtitle="تمام سفارش‌های ثبت‌شده"
          icon={<ShoppingBag className="h-6 w-6" />}
          color="bg-sky-50 text-sky-700"
        />
        <SummaryCard
          title="محصولات"
          value={productCount.toLocaleString("fa-IR")}
          subtitle={`${lowStockProducts.length.toLocaleString("fa-IR")} کالا کم‌موجود`}
          icon={<Boxes className="h-6 w-6" />}
          color="bg-purple-50 text-purple-700"
        />
        <SummaryCard
          title="کاربران"
          value={userCount.toLocaleString("fa-IR")}
          subtitle={`${reviewCount.toLocaleString("fa-IR")} دیدگاه ثبت‌شده`}
          icon={<Users className="h-6 w-6" />}
          color="bg-amber-50 text-amber-700"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.6fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-slate-900">وضعیت سفارش‌ها</h2>
              <p className="mt-1 text-xs text-slate-500">
                توزیع سفارش‌ها بر اساس مرحله پردازش
              </p>
            </div>
            <PackageCheck className="h-6 w-6 text-slate-300" />
          </div>
          <div className="mt-7 space-y-5">
            {Object.entries(orderStatusLabels).map(([status, label]) => {
              const count =
                statusGroups.find((group) => group.status === status)?._count
                  ._all ?? 0;

              return (
                <div key={status}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">{label}</span>
                    <span className="text-slate-400">
                      {count.toLocaleString("fa-IR")}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-[#ef394e] to-amber-400"
                      style={{
                        width: `${Math.round((count / maxStatusCount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-slate-900">سلامت فروشگاه</h2>
              <p className="mt-1 text-xs text-slate-500">شاخص‌های محتوایی</p>
            </div>
            <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
          </div>
          <div className="mt-7 space-y-4">
            <HealthMetric
              label="میانگین امتیاز محصولات"
              value={(ratingAggregate._avg.rating ?? 0).toLocaleString("fa-IR", {
                maximumFractionDigits: 1,
              })}
              icon={<Star className="h-4 w-4" />}
            />
            <HealthMetric
              label="دیدگاه‌های کاربران"
              value={reviewCount.toLocaleString("fa-IR")}
              icon={<MessageSquareText className="h-4 w-4" />}
            />
            <HealthMetric
              label="کالاهای کم‌موجود"
              value={lowStockProducts.length.toLocaleString("fa-IR")}
              icon={<AlertTriangle className="h-4 w-4" />}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-black text-slate-900">آخرین سفارش‌ها</h2>
              <p className="mt-1 text-xs text-slate-500">
                جدیدترین فعالیت‌های خرید
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs font-bold text-[#ef394e]"
            >
              همه سفارش‌ها
              <ArrowUpLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-800">
                    {order.user.name ||
                      order.user.mobile ||
                      order.user.email ||
                      "کاربر"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {order._count.items.toLocaleString("fa-IR")} قلم •{" "}
                    {order.createdAt.toLocaleDateString("fa-IR")}
                  </p>
                </div>
                <div className="shrink-0 text-left">
                  <p className="text-sm font-black text-slate-900">
                    {order.totalAmount.toLocaleString("fa-IR")}
                  </p>
                  <p className="text-[10px] text-slate-400">تومان</p>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-400">
                سفارشی ثبت نشده است.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-black text-slate-900">محصولات پرفروش</h2>
              <p className="mt-1 text-xs text-slate-500">
                بر اساس تعداد فروش
              </p>
            </div>
            <Link
              href="/admin/products"
              className="flex items-center gap-1 text-xs font-bold text-[#ef394e]"
            >
              مدیریت محصولات
              <ArrowUpLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {topOrderItems.map((item, index) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 rounded-2xl bg-slate-50 p-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-black text-slate-500 shadow-sm">
                  {(index + 1).toLocaleString("fa-IR")}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">
                  {productTitleMap.get(item.productId) || "محصول حذف‌شده"}
                </p>
                <span className="text-xs font-black text-emerald-600">
                  {(item._sum.quantity ?? 0).toLocaleString("fa-IR")} فروش
                </span>
              </div>
            ))}
            {topOrderItems.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-400">
                هنوز داده فروشی وجود ندارد.
              </p>
            )}
          </div>
        </div>
      </section>

      {lowStockProducts.length > 0 && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white p-3 text-amber-600 shadow-sm">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-black text-amber-900">هشدار موجودی انبار</h2>
              <p className="mt-1 text-xs leading-6 text-amber-700">
                موجودی این محصولات به پنج عدد یا کمتر رسیده است.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {lowStockProducts.map((product) => (
                  <Link
                    key={product.id}
                    href="/admin/products"
                    className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-amber-800 shadow-sm"
                  >
                    {product.title}: {product.stock.toLocaleString("fa-IR")}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
        {icon}
      </div>
      <p className="mt-5 text-xs font-bold text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
      <p className="mt-2 text-[11px] text-slate-400">{subtitle}</p>
    </div>
  );
}

function HealthMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
      <div className="text-slate-400">{icon}</div>
      <span className="flex-1 text-xs font-bold text-slate-600">{label}</span>
      <strong className="text-sm font-black text-slate-900">{value}</strong>
    </div>
  );
}

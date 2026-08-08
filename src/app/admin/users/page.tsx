import { updateUserRoleAction } from "@/app/actions/adminActions";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import {
  CalendarDays,
  Crown,
  MessageSquareText,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  Users,
} from "lucide-react";

export const revalidate = 0;

export default async function AdminUsersPage() {
  const session = await requireAdmin("/admin/users");
  const [users, adminCount] = await Promise.all([
    prisma.user.findMany({
      include: {
        _count: {
          select: {
            orders: true,
            reviews: true,
            wishlist: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#ef394e]">مدیریت دسترسی</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">کاربران</h1>
          <p className="mt-2 text-sm text-slate-500">
            حساب‌ها، فعالیت‌ها و سطح دسترسی مدیران را کنترل کنید.
          </p>
        </div>
        <div className="flex gap-3">
          <UserSummary
            icon={<Users className="h-5 w-5" />}
            label="کل کاربران"
            value={users.length}
          />
          <UserSummary
            icon={<Crown className="h-5 w-5" />}
            label="مدیران"
            value={adminCount}
            admin
          />
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        {users.map((user) => (
          <article
            key={user.id}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  user.role === "ADMIN"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {user.role === "ADMIN" ? (
                  <ShieldCheck className="h-6 w-6" />
                ) : (
                  <UserRound className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-black text-slate-900">
                    {user.name || user.mobile || user.email || "کاربر بدون نام"}
                  </h2>
                  {user.id === session.user.id && (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                      حساب شما
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-slate-400">
                  {user.mobile || user.email || user.id}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-black ${
                  user.role === "ADMIN"
                    ? "bg-purple-50 text-purple-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {user.role === "ADMIN" ? "مدیر" : "کاربر"}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <ActivityMetric
                icon={<ShoppingBag className="h-4 w-4" />}
                label="سفارش"
                value={user._count.orders}
              />
              <ActivityMetric
                icon={<MessageSquareText className="h-4 w-4" />}
                label="دیدگاه"
                value={user._count.reviews}
              />
              <ActivityMetric
                icon={<CalendarDays className="h-4 w-4" />}
                label="علاقه‌مندی"
                value={user._count.wishlist}
              />
            </div>

            <form
              action={updateUserRoleAction}
              className="mt-5 flex gap-2 border-t border-slate-100 pt-4"
            >
              <input type="hidden" name="userId" value={user.id} />
              <select
                name="role"
                defaultValue={user.role}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#ef394e]"
              >
                {(["USER", "ADMIN"] as Role[]).map((role) => (
                  <option key={role} value={role}>
                    {role === "ADMIN" ? "مدیر" : "کاربر عادی"}
                  </option>
                ))}
              </select>
              <AdminSubmitButton
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
                pendingLabel="ذخیره..."
              >
                تغییر دسترسی
              </AdminSubmitButton>
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}

function UserSummary({
  icon,
  label,
  value,
  admin = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  admin?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
        admin
          ? "border-purple-200 bg-purple-50 text-purple-700"
          : "border-slate-200 bg-white text-slate-600"
      }`}
    >
      {icon}
      <div>
        <p className="text-[10px] opacity-70">{label}</p>
        <p className="font-black">{value.toLocaleString("fa-IR")}</p>
      </div>
    </div>
  );
}

function ActivityMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <div className="mx-auto flex w-fit text-slate-400">{icon}</div>
      <p className="mt-2 text-sm font-black text-slate-800">
        {value.toLocaleString("fa-IR")}
      </p>
      <p className="mt-0.5 text-[10px] text-slate-400">{label}</p>
    </div>
  );
}

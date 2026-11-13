import { deleteCouponAction, saveCouponAction, toggleCouponAction } from "@/app/actions/adminCatalogActions";
import ActionForm from "@/components/admin/ActionForm";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { prisma } from "@/lib/prisma";
import { TicketPercent, Trash2 } from "lucide-react";

export const revalidate = 0;

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();
  const field = "mb-1 block text-xs font-bold text-slate-600";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-ink md:text-3xl">کدهای تخفیف</h1>

      <section className="card rounded-2xl p-5">
        <h2 className="mb-4 flex items-center gap-2 font-black text-ink">
          <TicketPercent className="h-5 w-5 text-brand-600" />
          ساخت کد جدید
        </h2>
        <ActionForm action={saveCouponAction} resetOnSuccess className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={field}>کد (حروف انگلیسی/عدد)</label>
            <input name="code" required dir="ltr" placeholder="WELCOME10" className="field py-2.5 text-right uppercase" />
          </div>
          <div>
            <label className={field}>نوع</label>
            <select name="type" className="field py-2.5">
              <option value="PERCENT">درصدی</option>
              <option value="FIXED">مبلغ ثابت (تومان)</option>
            </select>
          </div>
          <div>
            <label className={field}>مقدار</label>
            <input name="value" required inputMode="numeric" className="field py-2.5" />
          </div>
          <div>
            <label className={field}>سقف تخفیف درصدی (تومان)</label>
            <input name="maxDiscount" inputMode="numeric" placeholder="اختیاری" className="field py-2.5" />
          </div>
          <div>
            <label className={field}>حداقل مبلغ خرید (تومان)</label>
            <input name="minOrder" inputMode="numeric" placeholder="۰" className="field py-2.5" />
          </div>
          <div>
            <label className={field}>حداکثر تعداد استفاده</label>
            <input name="maxUses" inputMode="numeric" placeholder="نامحدود" className="field py-2.5" />
          </div>
          <div>
            <label className={field}>مدت اعتبار (روز)</label>
            <input name="days" inputMode="numeric" placeholder="بدون انقضا" className="field py-2.5" />
          </div>
          <div className="flex items-end">
            <AdminSubmitButton className="btn-primary w-full py-2.5">ساخت کد</AdminSubmitButton>
          </div>
        </ActionForm>
      </section>

      <div className="card overflow-hidden rounded-2xl">
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="p-3">کد</th>
                <th className="p-3">تخفیف</th>
                <th className="p-3">حداقل خرید</th>
                <th className="p-3">استفاده</th>
                <th className="p-3">انقضا</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((coupon) => {
                const expired = coupon.expiresAt !== null && coupon.expiresAt < now;
                return (
                  <tr key={coupon.id}>
                    <td className="p-3 font-mono font-bold" dir="ltr">{coupon.code}</td>
                    <td className="p-3">
                      {coupon.type === "PERCENT"
                        ? `${coupon.value.toLocaleString("fa-IR")}٪${coupon.maxDiscount ? ` (تا ${coupon.maxDiscount.toLocaleString("fa-IR")})` : ""}`
                        : `${coupon.value.toLocaleString("fa-IR")} تومان`}
                    </td>
                    <td className="p-3">{coupon.minOrder.toLocaleString("fa-IR")}</td>
                    <td className="p-3">
                      {coupon.usedCount.toLocaleString("fa-IR")}
                      {coupon.maxUses !== null && ` / ${coupon.maxUses.toLocaleString("fa-IR")}`}
                    </td>
                    <td className="p-3 text-slate-500">{coupon.expiresAt ? coupon.expiresAt.toLocaleDateString("fa-IR") : "—"}</td>
                    <td className="p-3">
                      <form action={toggleCouponAction}>
                        <input type="hidden" name="id" value={coupon.id} />
                        <button
                          type="submit"
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            expired ? "bg-slate-100 text-slate-500" : coupon.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {expired ? "منقضی" : coupon.isActive ? "فعال" : "غیرفعال"}
                        </button>
                      </form>
                    </td>
                    <td className="p-3">
                      <form action={deleteCouponAction}>
                        <input type="hidden" name="id" value={coupon.id} />
                        <button type="submit" aria-label="حذف" className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">هنوز کد تخفیفی ساخته نشده است.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

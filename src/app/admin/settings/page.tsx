import {
  deleteShippingMethodAction,
  saveSettingsAction,
  saveShippingMethodAction,
} from "@/app/actions/adminCatalogActions";
import ActionForm from "@/components/admin/ActionForm";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { prisma } from "@/lib/prisma";
import { getSettings, SETTING_FIELDS, type SettingKey } from "@/lib/settings";
import { Store, Trash2, Truck } from "lucide-react";

export const revalidate = 0;

type ShippingRow = {
  id: string;
  name: string;
  description: string | null;
  cost: number;
  freeOver: number | null;
  sortOrder: number;
  isActive: boolean;
};

function ShippingFields({ method }: { method?: ShippingRow }) {
  const label = "mb-1 block text-xs font-bold text-slate-600";
  return (
    <>
      {method && <input type="hidden" name="id" value={method.id} />}
      <div>
        <label className={label}>نام</label>
        <input name="name" required defaultValue={method?.name} placeholder="مثلاً پست پیشتاز" className="field py-2" />
      </div>
      <div>
        <label className={label}>توضیح</label>
        <input name="description" defaultValue={method?.description ?? ""} placeholder="مثلاً ۳ تا ۵ روز کاری" className="field py-2" />
      </div>
      <div>
        <label className={label}>هزینه (تومان)</label>
        <input name="cost" inputMode="numeric" defaultValue={method?.cost ?? 0} className="field py-2" />
      </div>
      <div>
        <label className={label}>رایگان برای خرید بالای</label>
        <input name="freeOver" inputMode="numeric" defaultValue={method?.freeOver ?? ""} placeholder="اختیاری" className="field py-2" />
      </div>
      <div>
        <label className={label}>ترتیب</label>
        <input name="sortOrder" inputMode="numeric" defaultValue={method?.sortOrder ?? 0} className="field py-2" />
      </div>
      <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-600">
        <input type="checkbox" name="isActive" defaultChecked={method?.isActive ?? true} className="h-4 w-4 accent-brand-500" />
        فعال
      </label>
    </>
  );
}

export default async function AdminSettingsPage() {
  const [settings, methods] = await Promise.all([
    getSettings(),
    prisma.shippingMethod.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);
  const keys = Object.keys(SETTING_FIELDS) as SettingKey[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-ink md:text-3xl">تنظیمات فروشگاه</h1>

      <section className="card rounded-2xl p-5">
        <h2 className="mb-1 flex items-center gap-2 font-black text-ink">
          <Truck className="h-5 w-5 text-brand-600" />
          روش‌های ارسال
        </h2>
        <p className="mb-4 text-xs text-slate-500">مشتری در صفحه تسویه یکی از روش‌های فعال را انتخاب می‌کند.</p>
        <div className="space-y-3">
          {methods.map((method) => (
            <div key={method.id} className="rounded-xl border border-slate-200 p-3">
              <ActionForm action={saveShippingMethodAction} className="grid items-end gap-3 sm:grid-cols-3 lg:grid-cols-[1.2fr_1.5fr_1fr_1fr_80px_70px_auto]">
                <ShippingFields method={method} />
                <AdminSubmitButton className="btn-dark px-4 py-2">ذخیره</AdminSubmitButton>
              </ActionForm>
              <form action={deleteShippingMethodAction} className="mt-2">
                <input type="hidden" name="id" value={method.id} />
                <button type="submit" className="flex items-center gap-1 text-xs font-bold text-rose-600">
                  <Trash2 className="h-3.5 w-3.5" />
                  حذف
                </button>
              </form>
            </div>
          ))}
          <div className="rounded-xl border-2 border-dashed border-slate-200 p-3">
            <p className="mb-2 text-xs font-bold text-slate-500">روش ارسال جدید</p>
            <ActionForm action={saveShippingMethodAction} resetOnSuccess className="grid items-end gap-3 sm:grid-cols-3 lg:grid-cols-[1.2fr_1.5fr_1fr_1fr_80px_70px_auto]">
              <ShippingFields />
              <AdminSubmitButton className="btn-primary px-4 py-2">افزودن</AdminSubmitButton>
            </ActionForm>
          </div>
        </div>
      </section>

      <section className="card rounded-2xl p-5">
        <h2 className="mb-1 flex items-center gap-2 font-black text-ink">
          <Store className="h-5 w-5 text-brand-600" />
          اطلاعات فروشگاه و صفحات قانونی
        </h2>
        <p className="mb-4 text-xs leading-6 text-slate-500">
          این اطلاعات در فوتر، صفحه تماس، درباره ما، قوانین، حریم خصوصی و شرایط بازگشت کالا نمایش داده می‌شود.
          فیلدهای خالی در سایت نمایش داده نمی‌شوند.
        </p>
        <ActionForm action={saveSettingsAction} className="grid gap-4 md:grid-cols-2">
          {keys.map((key) => {
            const config = SETTING_FIELDS[key];
            return (
              <div key={key} className={config.type === "textarea" ? "md:col-span-2" : ""}>
                <label htmlFor={key} className="mb-1 block text-xs font-bold text-slate-600">{config.label}</label>
                {config.type === "textarea" ? (
                  <textarea
                    id={key}
                    name={key}
                    rows={key === "address" ? 2 : 6}
                    defaultValue={settings[key]}
                    dir={key === "enamadHtml" ? "ltr" : undefined}
                    className="field leading-7"
                  />
                ) : (
                  <input id={key} name={key} defaultValue={settings[key]} className="field py-2.5" />
                )}
              </div>
            );
          })}
          <div className="md:col-span-2">
            <AdminSubmitButton className="btn-primary">ذخیره تنظیمات</AdminSubmitButton>
          </div>
        </ActionForm>
      </section>
    </div>
  );
}

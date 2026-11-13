"use client";

import { saveAddressAction, type AddressInput } from "@/app/actions/addressActions";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

export const PROVINCES = [
  "آذربایجان شرقی", "آذربایجان غربی", "اردبیل", "اصفهان", "البرز", "ایلام", "بوشهر",
  "تهران", "چهارمحال و بختیاری", "خراسان جنوبی", "خراسان رضوی", "خراسان شمالی",
  "خوزستان", "زنجان", "سمنان", "سیستان و بلوچستان", "فارس", "قزوین", "قم",
  "کردستان", "کرمان", "کرمانشاه", "کهگیلویه و بویراحمد", "گلستان", "گیلان",
  "لرستان", "مازندران", "مرکزی", "هرمزگان", "همدان", "یزد",
];

export default function AddressForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Partial<AddressInput>;
  onSaved?: (addressId: string) => void;
  onCancel?: () => void;
}) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: AddressInput = {
      id: initial?.id,
      title: String(form.get("title") ?? ""),
      recipientName: String(form.get("recipientName") ?? ""),
      mobile: String(form.get("mobile") ?? ""),
      province: String(form.get("province") ?? ""),
      city: String(form.get("city") ?? ""),
      address: String(form.get("address") ?? ""),
      postalCode: String(form.get("postalCode") ?? ""),
      isDefault: form.get("isDefault") === "on",
    };

    startTransition(async () => {
      setError("");
      const result = await saveAddressAction(input);
      if (result.success) {
        onSaved?.(result.addressId);
      } else {
        setError(result.message);
      }
    });
  };

  const label = "mb-1.5 block text-xs font-bold text-slate-600";

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className={label} htmlFor="recipientName">نام و نام خانوادگی گیرنده</label>
        <input id="recipientName" name="recipientName" required defaultValue={initial?.recipientName} className="field" />
      </div>
      <div>
        <label className={label} htmlFor="mobile">موبایل گیرنده</label>
        <input id="mobile" name="mobile" required inputMode="tel" dir="ltr" placeholder="09123456789" defaultValue={initial?.mobile} className="field text-right" />
      </div>
      <div>
        <label className={label} htmlFor="province">استان</label>
        <select id="province" name="province" required defaultValue={initial?.province ?? ""} className="field">
          <option value="" disabled>انتخاب استان</option>
          {PROVINCES.map((province) => (
            <option key={province} value={province}>{province}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="city">شهر</label>
        <input id="city" name="city" required defaultValue={initial?.city} className="field" />
      </div>
      <div className="sm:col-span-2">
        <label className={label} htmlFor="address">آدرس پستی</label>
        <textarea id="address" name="address" required rows={2} placeholder="خیابان، کوچه، پلاک، واحد" defaultValue={initial?.address} className="field" />
      </div>
      <div>
        <label className={label} htmlFor="postalCode">کد پستی (۱۰ رقم)</label>
        <input id="postalCode" name="postalCode" required inputMode="numeric" dir="ltr" defaultValue={initial?.postalCode} className="field text-right" />
      </div>
      <div>
        <label className={label} htmlFor="title">عنوان آدرس (اختیاری)</label>
        <input id="title" name="title" placeholder="مثلاً خانه یا محل کار" defaultValue={initial?.title} className="field" />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
        <input type="checkbox" name="isDefault" defaultChecked={initial?.isDefault} className="h-4 w-4 accent-brand-500" />
        آدرس پیش‌فرض من باشد
      </label>

      {error && (
        <p className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-bold text-rose-700 sm:col-span-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          ذخیره آدرس
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">
            انصراف
          </button>
        )}
      </div>
    </form>
  );
}

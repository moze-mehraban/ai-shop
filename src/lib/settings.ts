import "server-only";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

// همه تنظیماتی که مدیر از پنل «تنظیمات فروشگاه» وارد می‌کند
export const SETTING_FIELDS = {
  shopName: { label: "نام فروشگاه", type: "text", fallback: "AI-Shop" },
  shopTagline: { label: "شعار کوتاه", type: "text", fallback: "فروشگاه هوشمند" },
  phone: { label: "تلفن پشتیبانی", type: "text", fallback: "" },
  email: { label: "ایمیل پشتیبانی", type: "text", fallback: "" },
  address: { label: "آدرس فروشگاه", type: "textarea", fallback: "" },
  workingHours: { label: "ساعات پاسخگویی", type: "text", fallback: "" },
  instagram: { label: "آیدی اینستاگرام", type: "text", fallback: "" },
  telegram: { label: "آیدی تلگرام", type: "text", fallback: "" },
  adminMobile: { label: "موبایل مدیر (برای پیامک سفارش جدید)", type: "text", fallback: "" },
  cardNumber: { label: "شماره کارت برای پرداخت کارت‌به‌کارت (خالی = غیرفعال)", type: "text", fallback: "" },
  cardHolder: { label: "نام صاحب کارت", type: "text", fallback: "" },
  cardBank: { label: "نام بانک", type: "text", fallback: "" },
  paymentDeadlineHours: { label: "مهلت پرداخت سفارش (ساعت) — بعد از آن سفارش پرداخت‌نشده خودکار لغو می‌شود (سفارش پرداخت‌شده یا دارای رسید هرگز)؛ ۰ = غیرفعال", type: "text", fallback: "24" },
  returnWindowDays: { label: "مهلت درخواست مرجوعی بعد از تحویل (روز)؛ ۰ = غیرفعال", type: "text", fallback: "7" },
  aboutText: { label: "متن صفحه «درباره ما»", type: "textarea", fallback: "" },
  termsText: { label: "متن صفحه «قوانین و مقررات»", type: "textarea", fallback: "" },
  privacyText: { label: "متن صفحه «حریم خصوصی»", type: "textarea", fallback: "" },
  returnsText: { label: "متن صفحه «شرایط بازگشت کالا»", type: "textarea", fallback: "" },
  enamadHtml: { label: "کد HTML نماد اعتماد (اینماد)", type: "textarea", fallback: "" },
} as const;

export type SettingKey = keyof typeof SETTING_FIELDS;
export type SiteSettings = Record<SettingKey, string>;

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const rows = await prisma.setting.findMany();
  const stored = new Map(rows.map((row) => [row.key, row.value]));

  return Object.fromEntries(
    (Object.keys(SETTING_FIELDS) as SettingKey[]).map((key) => [
      key,
      stored.get(key)?.trim() || SETTING_FIELDS[key].fallback,
    ]),
  ) as SiteSettings;
});

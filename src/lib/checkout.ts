// محاسبات قیمت سفارش؛ هم در سرور (ثبت سفارش) و هم در صفحه تسویه استفاده می‌شود

export type ShippingMethodInfo = {
  id: string;
  name: string;
  description: string | null;
  cost: number;
  freeOver: number | null;
};

export type CouponInfo = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  maxDiscount: number | null;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | string | null;
  isActive: boolean;
};

export function getShippingCost(method: ShippingMethodInfo, subtotal: number) {
  if (method.freeOver !== null && subtotal >= method.freeOver) {
    return 0;
  }
  return Math.max(0, method.cost);
}

export function evaluateCoupon(
  coupon: CouponInfo | null,
  subtotal: number,
  now = new Date(),
): { discount: number; error?: string } {
  if (!coupon || !coupon.isActive) {
    return { discount: 0, error: "کد تخفیف معتبر نیست." };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return { discount: 0, error: "مهلت استفاده از این کد تخفیف تمام شده است." };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { discount: 0, error: "ظرفیت استفاده از این کد تخفیف تکمیل شده است." };
  }
  if (subtotal < coupon.minOrder) {
    return {
      discount: 0,
      error: `این کد برای خرید بالای ${coupon.minOrder.toLocaleString("fa-IR")} تومان فعال است.`,
    };
  }

  let discount =
    coupon.type === "PERCENT"
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value;

  if (coupon.type === "PERCENT" && coupon.maxDiscount !== null) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  return { discount: Math.max(0, Math.min(discount, subtotal)) };
}

export const ORDER_STATUS_LABELS = {
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت‌شده / در حال آماده‌سازی",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  CANCELED: "لغوشده",
} as const;

export const ORDER_STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-sky-50 text-sky-700 border-sky-200",
  SHIPPED: "bg-ai-50 text-ai-700 border-ai-100",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELED: "bg-slate-100 text-slate-500 border-slate-200",
} as const;

export function formatToman(value: number) {
  return `${Math.round(value).toLocaleString("fa-IR")} تومان`;
}

// ---------------- مرجوعی ----------------
export const RETURN_STATUS_LABELS = {
  REQUESTED: "در انتظار بررسی",
  APPROVED: "تأیید شد؛ کالا را ارسال کنید",
  REJECTED: "رد شد",
  RECEIVED: "کالا دریافت شد",
  REFUNDED: "مبلغ بازگردانده شد",
} as const;

export const RETURN_STATUS_STYLES = {
  REQUESTED: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-sky-50 text-sky-700 border-sky-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  RECEIVED: "bg-ai-50 text-ai-700 border-ai-100",
  REFUNDED: "bg-emerald-50 text-emerald-700 border-emerald-200",
} as const;

export const RETURN_REASONS = [
  "آسیب‌دیدگی کالا هنگام ارسال",
  "ایراد فنی یا خرابی",
  "مغایرت کالا با سفارش (رنگ، مدل، مشخصات)",
  "کسری یا ناقص بودن اقلام",
  "انصراف از خرید",
  "سایر",
] as const;

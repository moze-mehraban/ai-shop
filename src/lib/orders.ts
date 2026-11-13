import "server-only";
import { ORDER_STATUS_LABELS } from "@/lib/checkout";
import { normalizeDigits } from "@/lib/digits";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { sendSmsIrTemplate } from "@/lib/smsir";
import type { OrderStatus, Prisma } from "@prisma/client";

export const CANCELABLE_STATUSES: OrderStatus[] = ["PENDING", "PAID"];
export const AUTO_CANCEL_REASON = "لغو خودکار: مهلت پرداخت به پایان رسید";

type StockLine = { productId: string; variantId: string | null; quantity: number };

// برگرداندن کالا به موجودی انبار (محصول و تنوع)
export async function restoreStock(tx: Prisma.TransactionClient, lines: StockLine[]) {
  const byProduct = new Map<string, number>();
  for (const line of lines) {
    if (line.quantity <= 0) continue;
    byProduct.set(line.productId, (byProduct.get(line.productId) ?? 0) + line.quantity);
    if (line.variantId) {
      await tx.productVariant.updateMany({
        where: { id: line.variantId },
        data: { stock: { increment: line.quantity } },
      });
    }
  }
  for (const [productId, quantity] of byProduct) {
    await tx.product.updateMany({ where: { id: productId }, data: { stock: { increment: quantity } } });
  }
  return [...byProduct.keys()];
}

/**
 * لغو سفارش: وضعیت «لغوشده»، بازگشت موجودی و آزاد شدن کد تخفیف.
 * اگر سفارش در این فاصله وضعیتش عوض شده باشد (مثلاً پرداخت شده)، کاری انجام نمی‌شود.
 * خروجی: شناسه محصولاتی که موجودی‌شان برگشت (برای revalidate در اکشن‌ها).
 */
export async function cancelOrder(orderId: string, reason: string, allowed: OrderStatus[] = CANCELABLE_STATUSES) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        status: true,
        couponCode: true,
        items: { select: { productId: true, variantId: true, quantity: true } },
      },
    });
    if (!order || !allowed.includes(order.status)) return [];

    const updated = await tx.order.updateMany({
      where: { id: orderId, status: { in: allowed } },
      data: { status: "CANCELED", canceledAt: new Date(), cancelReason: reason.slice(0, 300) || null },
    });
    if (updated.count !== 1) return [];

    if (order.couponCode) {
      await tx.coupon.updateMany({
        where: { code: order.couponCode, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }
    return restoreStock(tx, order.items);
  });
}

export async function getPaymentDeadlineHours() {
  const settings = await getSettings();
  const hours = Number(normalizeDigits(settings.paymentDeadlineHours));
  return Number.isFinite(hours) && hours > 0 ? hours : 0;
}

export async function getReturnWindowDays() {
  const settings = await getSettings();
  const days = Number(normalizeDigits(settings.returnWindowDays));
  return Number.isFinite(days) && days > 0 ? days : 0;
}

export function paymentDeadline(createdAt: Date, hours: number) {
  return hours > 0 ? new Date(createdAt.getTime() + hours * 60 * 60 * 1000) : null;
}

const globalForExpiry = globalThis as unknown as { __lastOrderExpiry?: number };

/**
 * لغو خودکار سفارش‌های پرداخت‌نشده‌ای که مهلتشان گذشته است.
 * در بارگذاری صفحات و هنگام ثبت سفارش صدا زده می‌شود؛ حداکثر هر یک دقیقه یک بار اجرا می‌شود
 * (با force: true بلافاصله). خطاها صفحه را از کار نمی‌اندازند.
 */
export async function expireUnpaidOrders({ force = false } = {}) {
  const now = Date.now();
  if (!force && globalForExpiry.__lastOrderExpiry && now - globalForExpiry.__lastOrderExpiry < 60_000) {
    return 0;
  }
  globalForExpiry.__lastOrderExpiry = now;

  try {
    const hours = await getPaymentDeadlineHours();
    if (hours <= 0) return 0;

    const expired = await prisma.order.findMany({
      where: { status: "PENDING", createdAt: { lt: new Date(now - hours * 60 * 60 * 1000) } },
      select: { id: true, recipientMobile: true, user: { select: { mobile: true } } },
      take: 200,
    });

    let canceled = 0;
    for (const order of expired) {
      const restored = await cancelOrder(order.id, AUTO_CANCEL_REASON, ["PENDING"]);
      if (restored.length === 0) continue;
      canceled += 1;
      const mobile = order.recipientMobile || order.user.mobile;
      if (mobile) {
        await sendSmsIrTemplate({
          mobile,
          templateEnv: "SMSIR_STATUS_TEMPLATE_ID",
          parameters: { ORDER: order.id.slice(-8).toUpperCase(), STATUS: ORDER_STATUS_LABELS.CANCELED, TRACKING: "-" },
        });
      }
    }
    if (canceled > 0) console.info(`[orders] ${canceled} unpaid order(s) auto-canceled`);
    return canceled;
  } catch (error) {
    console.error("[orders] auto-cancel failed:", error instanceof Error ? error.message : error);
    return 0;
  }
}

export function isInFuture(date: Date) {
  return date.getTime() > Date.now();
}

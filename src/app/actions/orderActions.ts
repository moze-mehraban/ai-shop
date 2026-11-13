"use server";

import { authOptions } from "@/lib/auth";
import { evaluateCoupon, getShippingCost } from "@/lib/checkout";
import { getDiscountedPrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { expireUnpaidOrders } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { sendSmsIrTemplate } from "@/lib/smsir";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

type CheckoutItem = {
  productId: string;
  variantId?: string | null;
  quantity: number;
};

export type CheckoutInput = {
  items: CheckoutItem[];
  addressId: string;
  shippingMethodId: string;
  couponCode?: string;
  note?: string;
};

type CheckoutResult = {
  success: boolean;
  requiresLogin: boolean;
  message: string;
  orderId?: string;
};

function normalizeCode(code?: string) {
  return String(code ?? "").trim().toUpperCase().slice(0, 40);
}

// بررسی کد تخفیف در صفحه تسویه (مبلغ نهایی هنگام ثبت سفارش دوباره محاسبه می‌شود)
export async function checkCouponAction(code: string, subtotal: number) {
  const normalized = normalizeCode(code);
  if (!normalized) return { valid: false, discount: 0, message: "کد تخفیف را وارد کنید." };

  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
  const result = evaluateCoupon(coupon, Math.max(0, Number(subtotal) || 0));

  return result.error
    ? { valid: false, discount: 0, message: result.error }
    : {
        valid: true,
        discount: result.discount,
        message: `کد تخفیف اعمال شد: ${result.discount.toLocaleString("fa-IR")} تومان`,
      };
}

export async function createOrderAction(input: CheckoutInput): Promise<CheckoutResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      success: false,
      requiresLogin: true,
      message: "برای ثبت سفارش ابتدا وارد حساب کاربری خود شوید.",
    };
  }

  const userId = session.user.id;
  const items = Array.isArray(input?.items) ? input.items : [];

  // موجودی سفارش‌های پرداخت‌نشده منقضی‌شده قبل از بررسی موجودی آزاد می‌شود
  await expireUnpaidOrders({ force: true });

  if (items.length === 0 || items.length > 50) {
    return { success: false, requiresLogin: false, message: "سبد خرید معتبر نیست." };
  }

  // ادغام ردیف‌های تکراری (محصول + تنوع)
  const lines = new Map<string, { productId: string; variantId: string | null; quantity: number }>();
  for (const item of items) {
    if (typeof item?.productId !== "string" || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      continue;
    }
    const variantId = typeof item.variantId === "string" && item.variantId ? item.variantId : null;
    const key = `${item.productId}::${variantId ?? ""}`;
    const current = lines.get(key);
    lines.set(key, {
      productId: item.productId,
      variantId,
      quantity: Math.min(999, (current?.quantity ?? 0) + item.quantity),
    });
  }

  if (lines.size === 0) {
    return { success: false, requiresLogin: false, message: "سبد خرید معتبر نیست." };
  }

  const [address, shippingMethod] = await Promise.all([
    prisma.address.findFirst({ where: { id: String(input.addressId ?? ""), userId } }),
    prisma.shippingMethod.findFirst({
      where: { id: String(input.shippingMethodId ?? ""), isActive: true },
    }),
  ]);

  if (!address) {
    return { success: false, requiresLogin: false, message: "لطفاً آدرس تحویل را انتخاب کنید." };
  }
  if (!shippingMethod) {
    return { success: false, requiresLogin: false, message: "لطفاً روش ارسال را انتخاب کنید." };
  }

  const couponCode = normalizeCode(input.couponCode);
  const note = String(input.note ?? "").trim().slice(0, 500) || null;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const productIds = [...new Set([...lines.values()].map((line) => line.productId))];
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        include: { variants: true },
      });
      const productMap = new Map(products.map((product) => [product.id, product]));

      const orderItems: {
        productId: string;
        variantId: string | null;
        variantName: string | null;
        title: string;
        quantity: number;
        price: number;
      }[] = [];

      for (const line of lines.values()) {
        const product = productMap.get(line.productId);
        if (!product) {
          throw new Error("یکی از محصولات سبد دیگر در دسترس نیست.");
        }

        const variant = line.variantId
          ? product.variants.find((item) => item.id === line.variantId)
          : null;

        if (product.variants.length > 0 && !variant) {
          throw new Error(`لطفاً نوع «${product.title}» را دوباره از صفحه محصول انتخاب کنید.`);
        }

        if (variant) {
          const updated = await tx.productVariant.updateMany({
            where: { id: variant.id, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (updated.count !== 1) {
            throw new Error(`موجودی «${product.title} - ${variant.name}» کافی نیست.`);
          }
        }

        const updatedProduct = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (updatedProduct.count !== 1) {
          throw new Error(`موجودی «${product.title}» کافی نیست.`);
        }

        orderItems.push({
          productId: product.id,
          variantId: variant?.id ?? null,
          variantName: variant?.name ?? null,
          title: product.title,
          quantity: line.quantity,
          price: getDiscountedPrice(variant?.price ?? product.price, product.discountPercent),
        });
      }

      const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shippingCost = getShippingCost(shippingMethod, subtotal);

      let discountAmount = 0;
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
        const evaluation = evaluateCoupon(coupon, subtotal);
        if (evaluation.error || !coupon) {
          throw new Error(evaluation.error ?? "کد تخفیف معتبر نیست.");
        }
        const used = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            ...(coupon.maxUses !== null ? { usedCount: { lt: coupon.maxUses } } : {}),
          },
          data: { usedCount: { increment: 1 } },
        });
        if (used.count !== 1) {
          throw new Error("ظرفیت استفاده از این کد تخفیف تکمیل شده است.");
        }
        discountAmount = evaluation.discount;
      }

      return tx.order.create({
        data: {
          userId,
          subtotal,
          shippingCost,
          discountAmount,
          couponCode: couponCode || null,
          totalAmount: Math.max(0, subtotal - discountAmount + shippingCost),
          status: "PENDING",
          recipientName: address.recipientName,
          recipientMobile: address.mobile,
          province: address.province,
          city: address.city,
          address: address.address,
          postalCode: address.postalCode,
          shippingMethod: shippingMethod.name,
          customerNote: note,
          items: { create: orderItems },
        },
        select: { id: true, totalAmount: true },
      });
    });

    // اطلاع‌رسانی پیامکی (در صورت تنظیم قالب‌ها در env)
    const settings = await getSettings();
    const orderCode = order.id.slice(-8).toUpperCase();
    await Promise.all([
      sendSmsIrTemplate({
        mobile: address.mobile,
        templateEnv: "SMSIR_ORDER_TEMPLATE_ID",
        parameters: { ORDER: orderCode },
      }),
      sendSmsIrTemplate({
        mobile: settings.adminMobile,
        templateEnv: "SMSIR_ADMIN_ORDER_TEMPLATE_ID",
        parameters: { ORDER: orderCode, AMOUNT: Math.round(order.totalAmount).toString() },
      }),
    ]);

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/profile/orders");
    for (const productId of new Set([...lines.values()].map((line) => line.productId))) {
      revalidatePath(`/product/${productId}`);
    }

    return {
      success: true,
      requiresLogin: false,
      orderId: order.id,
      message: "سفارش شما با موفقیت ثبت شد.",
    };
  } catch (error) {
    return {
      success: false,
      requiresLogin: false,
      message: error instanceof Error ? error.message : "ثبت سفارش با خطا مواجه شد.",
    };
  }
}

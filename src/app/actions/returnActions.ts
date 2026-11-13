"use server";

import { requireAdmin } from "@/lib/admin";
import { authOptions } from "@/lib/auth";
import { RETURN_REASONS, RETURN_STATUS_LABELS } from "@/lib/checkout";
import { normalizeDigits } from "@/lib/digits";
import { getReturnWindowDays, restoreStock } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { sendSmsIrTemplate } from "@/lib/smsir";
import type { ReturnStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export type ReturnInput = {
  orderId: string;
  items: { orderItemId: string; quantity: number }[];
  reason: string;
  description?: string;
};

// تعداد قابل مرجوع هر قلم = تعداد خریداری‌شده − تعداد درخواست‌های قبلی (به‌جز ردشده‌ها)
export async function getReturnableQuantities(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      items: {
        select: {
          id: true,
          quantity: true,
          returnItems: { where: { request: { status: { not: "REJECTED" } } }, select: { quantity: true } },
        },
      },
    },
  });
  return new Map(
    (order?.items ?? []).map((item) => [
      item.id,
      Math.max(0, item.quantity - item.returnItems.reduce((sum, returned) => sum + returned.quantity, 0)),
    ]),
  );
}

export async function createReturnAction(input: ReturnInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: "ابتدا وارد حساب کاربری شوید." };

  const order = await prisma.order.findFirst({
    where: { id: String(input?.orderId ?? ""), userId: session.user.id },
    select: { id: true, status: true, deliveredAt: true, updatedAt: true, recipientMobile: true },
  });
  if (!order) return { success: false, message: "سفارش پیدا نشد." };
  if (order.status !== "DELIVERED") return { success: false, message: "فقط سفارش‌های تحویل‌شده قابل مرجوع هستند." };

  const windowDays = await getReturnWindowDays();
  const deliveredAt = order.deliveredAt ?? order.updatedAt;
  if (windowDays <= 0 || Date.now() - deliveredAt.getTime() > windowDays * 24 * 60 * 60 * 1000) {
    return { success: false, message: "مهلت ثبت درخواست مرجوعی برای این سفارش به پایان رسیده است." };
  }

  const reason = String(input.reason ?? "").trim();
  if (!(RETURN_REASONS as readonly string[]).includes(reason)) {
    return { success: false, message: "دلیل مرجوعی را انتخاب کنید." };
  }
  const description = String(input.description ?? "").trim().slice(0, 1000) || null;
  if (reason === "سایر" && !description) {
    return { success: false, message: "لطفاً توضیح دهید چرا کالا را مرجوع می‌کنید." };
  }

  const available = await getReturnableQuantities(order.id);
  const items = (Array.isArray(input.items) ? input.items : [])
    .map((item) => ({ orderItemId: String(item?.orderItemId ?? ""), quantity: Math.trunc(Number(item?.quantity) || 0) }))
    .filter((item) => item.quantity > 0);

  if (items.length === 0) return { success: false, message: "حداقل یک کالا و تعداد آن را انتخاب کنید." };
  for (const item of items) {
    const max = available.get(item.orderItemId);
    if (max === undefined) return { success: false, message: "یکی از اقلام انتخاب‌شده متعلق به این سفارش نیست." };
    if (item.quantity > max) return { success: false, message: "تعداد انتخاب‌شده بیشتر از تعداد قابل مرجوع است." };
  }

  await prisma.returnRequest.create({
    data: {
      orderId: order.id,
      userId: session.user.id,
      reason,
      description,
      items: { create: items },
    },
  });

  // پیامک به مدیر (در صورت تنظیم قالب)
  const settings = await getSettings();
  await sendSmsIrTemplate({
    mobile: settings.adminMobile,
    templateEnv: "SMSIR_ADMIN_RETURN_TEMPLATE_ID",
    parameters: { ORDER: order.id.slice(-8).toUpperCase() },
  });

  revalidatePath(`/profile/orders/${order.id}`);
  revalidatePath("/profile/returns");
  revalidatePath("/admin");
  revalidatePath("/admin/returns");
  return { success: true, message: "درخواست مرجوعی ثبت شد. نتیجه بررسی از همین صفحه و با پیامک اطلاع داده می‌شود." };
}

// ---------------- پنل مدیریت ----------------

const NEXT_STATUSES: Record<ReturnStatus, ReturnStatus[]> = {
  REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["RECEIVED", "REJECTED"],
  RECEIVED: ["REFUNDED"],
  REJECTED: [],
  REFUNDED: [],
};

export async function updateReturnStatusAction(formData: FormData) {
  await requireAdmin("/admin/returns");

  const returnId = String(formData.get("returnId") ?? "");
  const status = String(formData.get("status") ?? "") as ReturnStatus;
  const adminNote = String(formData.get("adminNote") ?? "").trim().slice(0, 1000);
  const restock = formData.get("restock") === "on";
  const refundRaw = normalizeDigits(String(formData.get("refundAmount") ?? "")).replace(/[,٬\s]/g, "");
  const refundAmount = refundRaw ? Number(refundRaw) : null;

  const request = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: {
      order: { select: { id: true, recipientMobile: true, user: { select: { mobile: true } } } },
      items: { include: { orderItem: { select: { productId: true, variantId: true } } } },
    },
  });
  if (!request || !NEXT_STATUSES[request.status].includes(status)) return;

  await prisma.$transaction(async (tx) => {
    const updated = await tx.returnRequest.updateMany({
      where: { id: returnId, status: request.status },
      data: {
        status,
        ...(adminNote ? { adminNote } : {}),
        ...(status === "REFUNDED" && refundAmount !== null && Number.isFinite(refundAmount) && refundAmount >= 0 ? { refundAmount } : {}),
        ...(status === "RECEIVED" && restock ? { restocked: true } : {}),
      },
    });
    // کالای دریافت‌شده در صورت انتخاب مدیر به موجودی برمی‌گردد
    if (updated.count === 1 && status === "RECEIVED" && restock && !request.restocked) {
      await restoreStock(
        tx,
        request.items.map((item) => ({
          productId: item.orderItem.productId,
          variantId: item.orderItem.variantId,
          quantity: item.quantity,
        })),
      );
    }
  });

  const mobile = request.order.recipientMobile || request.order.user.mobile;
  if (mobile) {
    await sendSmsIrTemplate({
      mobile,
      templateEnv: "SMSIR_RETURN_TEMPLATE_ID",
      parameters: { ORDER: request.order.id.slice(-8).toUpperCase(), STATUS: RETURN_STATUS_LABELS[status] },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${returnId}`);
  revalidatePath(`/admin/orders/${request.order.id}`);
  revalidatePath(`/profile/orders/${request.order.id}`);
  revalidatePath("/profile/returns");
  if (restock) revalidatePath("/", "layout");
}

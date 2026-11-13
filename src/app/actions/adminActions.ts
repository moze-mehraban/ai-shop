"use server";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import type { OrderStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { summarizeReviewsWithOpenRouter } from "@/lib/openrouter";
import { ORDER_STATUS_LABELS } from "@/lib/checkout";
import { sendSmsIrTemplate } from "@/lib/smsir";
import { cancelOrder } from "@/lib/orders";

// پیامک تغییر وضعیت سفارش به مشتری (در صورت تنظیم SMSIR_STATUS_TEMPLATE_ID)
async function notifyOrderStatus(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      trackingCode: true,
      recipientMobile: true,
      user: { select: { mobile: true } },
    },
  });
  const mobile = order?.recipientMobile || order?.user.mobile;
  if (!order || !mobile) return;

  await sendSmsIrTemplate({
    mobile,
    templateEnv: "SMSIR_STATUS_TEMPLATE_ID",
    parameters: {
      ORDER: order.id.slice(-8).toUpperCase(),
      STATUS: ORDER_STATUS_LABELS[order.status],
      TRACKING: order.trackingCode || "-",
    },
  });
}

export type GenerateSummaryState = {
  status: "idle" | "success" | "error";
  message: string;
};

const nextOrderStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "PAID",
  PAID: "SHIPPED",
  SHIPPED: "DELIVERED",
};


const roles: Role[] = ["USER", "ADMIN"];

function getRequiredText(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

export async function generateProductSummaryAction(
  productId: string,
  _previousState: GenerateSummaryState,
  _formData: FormData,
): Promise<GenerateSummaryState> {
  void _previousState;
  void _formData;

  await requireAdmin("/admin/products");

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      title: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 40,
        select: {
          id: true,
          rating: true,
          content: true,
        },
      },
    },
  });

  if (!product) {
    return {
      status: "error",
      message: "محصول پیدا نشد.",
    };
  }

  if (product.reviews.length === 0) {
    return {
      status: "error",
      message: "برای این محصول هنوز دیدگاهی ثبت نشده است.",
    };
  }

  const reviews = product.reviews
    .map((review) => ({
      rating: review.rating,
      content: review.content.trim().slice(0, 1200),
    }))
    .filter((review) => review.content.length > 0);

  if (reviews.length === 0) {
    return {
      status: "error",
      message: "دیدگاه قابل تحلیلی برای این محصول وجود ندارد.",
    };
  }

  try {
    const summary = await summarizeReviewsWithOpenRouter({
      productTitle: product.title,
      reviews,
    });

    await prisma.$transaction([
      prisma.product.update({
        where: { id: product.id },
        data: { aiSummary: summary },
      }),
      prisma.review.updateMany({
        where: {
          id: {
            in: product.reviews.map((review) => review.id),
          },
        },
        data: { isAnalyzed: true },
      }),
    ]);

    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath("/product/[id]", "page");

    return {
      status: "success",
      message: `خلاصه با تحلیل ${reviews.length.toLocaleString("fa-IR")} دیدگاه ساخته شد.`,
    };
  } catch (error) {
    console.error(
      "OpenRouter summary generation failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      status: "error",
      message:
        error instanceof Error &&
        error.message === "OPENROUTER_NOT_CONFIGURED"
          ? "کلید OpenRouter در تنظیمات سرور وارد نشده است."
          : "ساخت خلاصه با OpenRouter انجام نشد. تنظیمات کلید، مدل و اعتبار حساب را بررسی کنید.",
    };
  }
}

export async function advanceOrderStatusAction(formData: FormData) {
  await requireAdmin("/admin/orders");

  const orderId = getRequiredText(formData, "orderId");

  if (!orderId) {
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  if (!order) {
    return;
  }

  const nextStatus = nextOrderStatus[order.status];

  if (!nextStatus) {
    return;
  }

  const updated = await prisma.order.updateMany({
    where: {
      id: orderId,
      status: order.status,
    },
    data: {
      status: nextStatus,
      ...(nextStatus === "DELIVERED" ? { deliveredAt: new Date() } : {}),
    },
  });

  if (updated.count === 1) {
    await notifyOrderStatus(orderId);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/profile/orders");
}

export async function cancelOrderAction(formData: FormData) {
  await requireAdmin("/admin/orders");

  const orderId = getRequiredText(formData, "orderId");
  const reason = getRequiredText(formData, "reason").slice(0, 300) || "لغو توسط فروشگاه";

  if (!orderId) {
    return;
  }

  const restoredProductIds = await cancelOrder(orderId, reason);

  if (restoredProductIds.length > 0) {
    await notifyOrderStatus(orderId);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/products");
  revalidatePath("/profile/orders");

  if (restoredProductIds.length > 0) {
    revalidatePath("/product/[id]", "page");
  }
}

export async function updateUserRoleAction(formData: FormData) {
  const session = await requireAdmin("/admin/users");

  const userId = getRequiredText(formData, "userId");
  const role = getRequiredText(formData, "role") as Role;

  if (!userId || !roles.includes(role)) {
    return;
  }

  if (userId === session.user.id && role !== "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });

    if (adminCount <= 1) {
      return;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/users");
}

export async function deleteReviewAction(formData: FormData) {
  await requireAdmin("/admin/reviews");

  const reviewId = getRequiredText(formData, "reviewId");
  const productId = getRequiredText(formData, "productId");

  if (!reviewId) {
    return;
  }

  await prisma.review.delete({
    where: { id: reviewId },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/reviews");

  if (productId) {
    revalidatePath("/product/[id]", "page");
  }
}

export async function updateOrderInfoAction(formData: FormData) {
  await requireAdmin("/admin/orders");

  const orderId = getRequiredText(formData, "orderId");
  const trackingCode = getRequiredText(formData, "trackingCode").slice(0, 60) || null;
  const adminNote = getRequiredText(formData, "adminNote").slice(0, 2000) || null;

  if (!orderId) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { trackingCode, adminNote },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/profile/orders/${orderId}`);
}

export async function setReviewApprovalAction(formData: FormData) {
  await requireAdmin("/admin/reviews");

  const reviewId = getRequiredText(formData, "reviewId");
  const approve = getRequiredText(formData, "approve") === "1";

  await prisma.review.update({
    where: { id: reviewId },
    data: { isApproved: approve },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/reviews");
  revalidatePath("/product/[id]", "page");
}

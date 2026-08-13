"use server";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import type { OrderStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { summarizeReviewsWithOpenRouter } from "@/lib/openrouter";

export type GenerateSummaryState = {
  status: "idle" | "success" | "error";
  message: string;
};

const nextOrderStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "PAID",
  PAID: "SHIPPED",
  SHIPPED: "DELIVERED",
};

const cancelableOrderStatuses: OrderStatus[] = ["PENDING", "PAID"];

const roles: Role[] = ["USER", "ADMIN"];

function getRequiredText(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function getNumber(formData: FormData, field: string) {
  return Number(formData.get(field));
}

function createSlug(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin("/admin/products");

  const name = getRequiredText(formData, "name");
  const submittedSlug = getRequiredText(formData, "slug");
  const slug = createSlug(submittedSlug || name);

  if (name.length < 2 || !slug) {
    return;
  }

  await prisma.category.create({
    data: { name, slug },
  });

  revalidatePath("/");
  revalidatePath("/admin/products");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin("/admin/products");

  const categoryId = getRequiredText(formData, "categoryId");
  const productCount = await prisma.product.count({
    where: { categoryId },
  });

  if (productCount > 0) {
    return;
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });

  revalidatePath("/admin/products");
}

export async function createProductAction(formData: FormData) {
  await requireAdmin("/admin/products");

  const title = getRequiredText(formData, "title");
  const description = getRequiredText(formData, "description");
  const imageUrl = getRequiredText(formData, "imageUrl");
  const categoryId = getRequiredText(formData, "categoryId");
  const price = getNumber(formData, "price");
  const discountPercent = getNumber(formData, "discountPercent");
  const stock = getNumber(formData, "stock");

  if (
    title.length < 2 ||
    description.length < 3 ||
    !categoryId ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isInteger(discountPercent) ||
    discountPercent < 0 ||
    discountPercent > 90 ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    return;
  }

  await prisma.product.create({
    data: {
      title,
      description,
      imageUrl: imageUrl || null,
      categoryId,
      price,
      discountPercent,
      stock,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin("/admin/products");

  const productId = getRequiredText(formData, "productId");
  const title = getRequiredText(formData, "title");
  const description = getRequiredText(formData, "description");
  const imageUrl = getRequiredText(formData, "imageUrl");
  const categoryId = getRequiredText(formData, "categoryId");
  const aiSummary = getRequiredText(formData, "aiSummary");
  const price = getNumber(formData, "price");
  const discountPercent = getNumber(formData, "discountPercent");
  const stock = getNumber(formData, "stock");

  if (
    !productId ||
    title.length < 2 ||
    description.length < 3 ||
    !categoryId ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isInteger(discountPercent) ||
    discountPercent < 0 ||
    discountPercent > 90 ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    return;
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      title,
      description,
      imageUrl: imageUrl || null,
      category: {
        connect: { id: categoryId },
      },
      aiSummary: aiSummary || null,
      price,
      discountPercent,
      stock,
    },
  });

  revalidatePath("/");
  revalidatePath(`/product/${productId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/products");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin("/admin/products");

  const productId = getRequiredText(formData, "productId");
  const orderItemCount = await prisma.orderItem.count({
    where: { productId },
  });

  if (orderItemCount > 0) {
    return;
  }

  await prisma.product.delete({
    where: { id: productId },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
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
    revalidatePath(`/product/${product.id}`);

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

  await prisma.order.updateMany({
    where: {
      id: orderId,
      status: order.status,
    },
    data: { status: nextStatus },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/profile/orders");
}

export async function cancelOrderAction(formData: FormData) {
  await requireAdmin("/admin/orders");

  const orderId = getRequiredText(formData, "orderId");

  if (!orderId) {
    return;
  }

  const restoredProductIds = await prisma.$transaction(
    async (transaction) => {
      const order = await transaction.order.findUnique({
        where: { id: orderId },
        select: {
          status: true,
          items: {
            select: {
              productId: true,
              quantity: true,
            },
          },
        },
      });

      if (!order || !cancelableOrderStatuses.includes(order.status)) {
        return [];
      }

      const cancellation = await transaction.order.updateMany({
        where: {
          id: orderId,
          status: {
            in: cancelableOrderStatuses,
          },
        },
        data: { status: "CANCELED" },
      });

      if (cancellation.count !== 1) {
        return [];
      }

      const quantitiesByProduct = new Map<string, number>();

      for (const item of order.items) {
        quantitiesByProduct.set(
          item.productId,
          (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      }

      for (const [productId, quantity] of quantitiesByProduct) {
        await transaction.product.update({
          where: { id: productId },
          data: {
            stock: {
              increment: quantity,
            },
          },
        });
      }

      return [...quantitiesByProduct.keys()];
    },
  );

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/products");
  revalidatePath("/profile/orders");

  for (const productId of restoredProductIds) {
    revalidatePath(`/product/${productId}`);
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
    revalidatePath(`/product/${productId}`);
  }
}

"use server";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import type { OrderStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

const orderStatuses: OrderStatus[] = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELED",
];

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

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin("/admin/orders");

  const orderId = getRequiredText(formData, "orderId");
  const status = getRequiredText(formData, "status") as OrderStatus;

  if (!orderId || !orderStatuses.includes(status)) {
    return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/profile/orders");
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

"use server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function toggleWishlistAction(productId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      success: false,
      requiresLogin: true,
      isWishlisted: false,
      message: "برای استفاده از علاقه‌مندی‌ها ابتدا وارد شوید.",
    };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    return {
      success: false,
      requiresLogin: false,
      isWishlisted: false,
      message: "محصول پیدا نشد.",
    };
  }

  const existingItem = await prisma.wishlist.findUnique({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId,
      },
    },
    select: { id: true },
  });

  if (existingItem) {
    await prisma.wishlist.delete({
      where: { id: existingItem.id },
    });
  } else {
    await prisma.wishlist.create({
      data: {
        userId: session.user.id,
        productId,
      },
    });
  }

  revalidatePath(`/product/${productId}`);
  revalidatePath("/profile/wishlist");

  return {
    success: true,
    requiresLogin: false,
    isWishlisted: !existingItem,
    message: existingItem
      ? "از علاقه‌مندی‌ها حذف شد."
      : "به علاقه‌مندی‌ها اضافه شد.",
  };
}

"use server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// «موجود شد خبرم کن»: ثبت یا لغو درخواست اطلاع‌رسانی
export async function toggleStockNotificationAction(productId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, requiresLogin: true, subscribed: false };
  }

  const where = {
    userId_productId: { userId: session.user.id, productId },
  };
  const existing = await prisma.stockNotification.findUnique({ where });

  if (existing && !existing.notifiedAt) {
    await prisma.stockNotification.delete({ where });
    return { success: true, requiresLogin: false, subscribed: false };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    return { success: false, requiresLogin: false, subscribed: false };
  }

  await prisma.stockNotification.upsert({
    where,
    create: { userId: session.user.id, productId },
    update: { notifiedAt: null, createdAt: new Date() },
  });

  return { success: true, requiresLogin: false, subscribed: true };
}

"use server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

type CheckoutItem = {
  productId: string;
  quantity: number;
};

export async function createOrderAction(items: CheckoutItem[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      success: false,
      requiresLogin: true,
      message: "برای ثبت سفارش ابتدا وارد حساب کاربری خود شوید.",
    };
  }

  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return {
      success: false,
      requiresLogin: false,
      message: "سبد خرید معتبر نیست.",
    };
  }

  const normalizedItems = Array.from(
    items.reduce((itemMap, item) => {
      if (
        typeof item.productId === "string" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
      ) {
        itemMap.set(
          item.productId,
          (itemMap.get(item.productId) ?? 0) + item.quantity,
        );
      }

      return itemMap;
    }, new Map<string, number>()),
    ([productId, quantity]) => ({ productId, quantity }),
  );

  if (normalizedItems.length === 0) {
    return {
      success: false,
      requiresLogin: false,
      message: "سبد خرید معتبر نیست.",
    };
  }

  try {
    const order = await prisma.$transaction(async (transaction) => {
      const products = await transaction.product.findMany({
        where: {
          id: {
            in: normalizedItems.map((item) => item.productId),
          },
        },
        select: {
          id: true,
          title: true,
          price: true,
          stock: true,
        },
      });

      if (products.length !== normalizedItems.length) {
        throw new Error("یکی از محصولات دیگر در دسترس نیست.");
      }

      const productMap = new Map(
        products.map((product) => [product.id, product]),
      );

      for (const item of normalizedItems) {
        const product = productMap.get(item.productId);

        if (!product || product.stock < item.quantity) {
          throw new Error(
            `موجودی «${product?.title ?? "محصول"}» کافی نیست.`,
          );
        }

        const stockUpdate = await transaction.product.updateMany({
          where: {
            id: item.productId,
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (stockUpdate.count !== 1) {
          throw new Error(`موجودی «${product.title}» تغییر کرده است.`);
        }
      }

      const totalAmount = normalizedItems.reduce((sum, item) => {
        const product = productMap.get(item.productId);
        return sum + (product?.price ?? 0) * item.quantity;
      }, 0);

      return transaction.order.create({
        data: {
          userId: session.user.id,
          totalAmount,
          status: "PENDING",
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: productMap.get(item.productId)?.price ?? 0,
            })),
          },
        },
        select: {
          id: true,
        },
      });
    });

    revalidatePath("/");
    revalidatePath("/profile/orders");

    for (const item of normalizedItems) {
      revalidatePath(`/product/${item.productId}`);
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
      message:
        error instanceof Error
          ? error.message
          : "ثبت سفارش با خطا مواجه شد.",
    };
  }
}

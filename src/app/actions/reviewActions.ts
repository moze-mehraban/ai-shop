"use server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export type ReviewActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function addReviewAction(
  productId: string,
  _previousState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      status: "error",
      message: "برای ثبت دیدگاه ابتدا وارد حساب کاربری خود شوید.",
    };
  }

  const content = String(formData.get("content") ?? "").trim();
  const rating = Number(formData.get("rating"));

  if (content.length < 10) {
    return {
      status: "error",
      message: "متن دیدگاه باید حداقل ۱۰ کاراکتر باشد.",
    };
  }

  if (content.length > 1000) {
    return {
      status: "error",
      message: "متن دیدگاه نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد.",
    };
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return {
      status: "error",
      message: "امتیاز انتخاب‌شده معتبر نیست.",
    };
  }

  const sessionUser = session.user as typeof session.user & { id?: string };
  const identifier = sessionUser.id || session.user.email;

  if (!identifier) {
    return {
      status: "error",
      message: "شناسه حساب کاربری پیدا نشد. لطفاً دوباره وارد شوید.",
    };
  }

  const [user, product] = await Promise.all([
    prisma.user.findFirst({
      where: {
        OR: [
          { id: identifier },
          { email: identifier },
          { mobile: identifier },
        ],
      },
      select: { id: true },
    }),
    prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    }),
  ]);

  if (!user) {
    return {
      status: "error",
      message: "حساب کاربری شما در پایگاه داده پیدا نشد.",
    };
  }

  if (!product) {
    return {
      status: "error",
      message: "این محصول دیگر در دسترس نیست.",
    };
  }

  await prisma.review.create({
    data: {
      productId,
      userId: user.id,
      content,
      rating,
      sentiment:
        rating >= 4 ? "POSITIVE" : rating <= 2 ? "NEGATIVE" : "NEUTRAL",
    },
  });

  revalidatePath(`/product/${productId}`);

  return {
    status: "success",
    message: "دیدگاه شما با موفقیت ثبت شد.",
  };
}

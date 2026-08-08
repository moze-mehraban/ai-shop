'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addReviewAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return { success: false, error: "لطفاً ابتدا وارد حساب کاربری خود شوید." };
  }

  const productId = formData.get("productId") as string;
  const rating = parseInt(formData.get("rating") as string) || 5;
  const comment = formData.get("comment") as string;

  if (!productId || !comment) {
    return { success: false, error: "لطفاً متن نظر خود را وارد کنید." };
  }

  // تحلیل هوش مصنوعی نمایشی (در نسخه پیشرفته‌تر می‌توانید به API مدل‌های هوش مصنوعی متصل کنید)
  const isPositive = rating >= 4;
  const sentiment = isPositive ? "POSITIVE" : rating === 3 ? "NEUTRAL" : "NEGATIVE";
  
  const strengths = isPositive ? "کیفیت ساخت بالا, ارزش خرید نسبت به قیمت, طراحی زیبا" : "";
  const weaknesses = !isPositive ? "کیفیت پایین بسته‌بندی, عدم تطابق با مشخصات" : "";

  try {
    await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        rating,
        comment,
        sentiment,
        strengths,
        weaknesses,
      },
    });

    revalidatePath(`/products/${productId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: "خطا در ثبت نظر. لطفاً دوباره تلاش کنید." };
  }
}
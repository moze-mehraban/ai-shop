"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addReviewAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  
  // بررسی وجود نشست (Session)
  if (!session || !session.user) {
    throw new Error("لطفا ابتدا وارد حساب کاربری خود شوید");
  }

  // استخراج شناسه کاربر (ممکن است در سیستم شما موبایل یا آیدی باشد)
  // در NextAuth گاهی شماره موبایل درون فیلد ایمیل قرار می‌گیرد
  const identifier = session.user.email || (session.user as any).mobile || (session.user as any).id;

  if (!identifier) {
    throw new Error("شناسه کاربری در نشست (session) یافت نشد.");
  }

  // پیدا کردن کاربر با پشتیبانی از ایمیل، شماره موبایل یا آیدی
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { mobile: identifier },
        { id: identifier } // اگر شناسه کاربر یک استرینگ (مانند UUID یا ObjectID) باشد
      ]
    }
  });

  if (!user) {
    throw new Error("کاربر یافت نشد. ممکن است اطلاعات کاربری شما تغییر کرده باشد.");
  }

  // دریافت اطلاعات فرم
  const productId = formData.get("productId") as string;
  const comment = formData.get("comment") as string;
  const rating = parseInt(formData.get("rating") as string, 10);

  if (!productId || !comment || isNaN(rating)) {
    throw new Error("اطلاعات ارسال شده برای ثبت نظر نامعتبر است.");
  }

  // ثبت نظر در دیتابیس
  await prisma.review.create({
    data: {
      productId,
      userId: user.id,
      content: comment,
      rating,
      sentiment: rating >= 4 ? "POSITIVE" : rating <= 2 ? "NEGATIVE" : "NEUTRAL"
    }
  });

  // رفرش کردن کش صفحه برای نمایش فوری نظر 
  // (مطابق ارور شما مسیر product است)
  revalidatePath(`/product/${productId}`);
}
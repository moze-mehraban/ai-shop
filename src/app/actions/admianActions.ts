"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
// import { getServerSession } from "next-auth"; 
// اینجا می‌توانید چک کنید که کاربر حتما ادمین باشد

export async function generateProductAiSummary(productId: string) {
  try {
    // ۱. دریافت محصول و نظرات آن
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { reviews: true }
    });

    if (!product) throw new Error("محصول یافت نشد");

    // ۲. فیلتر کردن نظرات معتبر
    const validReviews = product.reviews
      .map(r => r.content || (r as any).text || "")
      .filter(text => text.trim().length > 10);

    if (validReviews.length === 0) {
      return { success: false, message: "نظرات کافی برای تحلیل وجود ندارد." };
    }

    const selectedReviews = validReviews.slice(0, 15).join("\n- ");
    const prompt = `بر اساس نظرات زیر، یک خلاصه ۳ الی ۴ خطی، روان و یکپارچه از نقاط قوت و ضعف محصول برای راهنمایی خریداران بنویس:\n- ${selectedReviews}`;

    // ۳. ارسال به هوش مصنوعی
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) throw new Error("خطا در ارتباط با API هوش مصنوعی");

    const data = await response.json();
    const aiText = data.choices[0].message.content;

    // ۴. ذخیره در دیتابیس
    await prisma.product.update({
      where: { id: productId },
      data: { aiSummary: aiText }
    });

    // ۵. رفرش کردن کش صفحه محصول برای نمایش فوری
    revalidatePath(`/product/${productId}`);

    return { success: true, summary: aiText };

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return { success: false, message: error.message || "خطای ناشناخته رخ داد" };
  }
}
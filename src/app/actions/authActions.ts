'use server';

import { prisma } from "@/lib/prisma";
import { sendBaleOtp } from "@/lib/bale";

export async function requestOtpAction(mobile: string) {
  if (!/^09\d{9}$/.test(mobile)) {
    return { success: false, error: "شماره موبایل نامعتبر است. (مثال: 09123456789)" };
  }

  const recentCode = await prisma.verificationCode.findFirst({
    where: {
      mobile,
      createdAt: {
        gte: new Date(Date.now() - 60 * 1000),
      },
    },
    select: { id: true },
  });

  if (recentCode) {
    return {
      success: false,
      error: "لطفاً یک دقیقه برای درخواست کد جدید صبر کنید.",
    };
  }

  // تولید کد ۵ رقمی تصادفی
  const code = Math.floor(10000 + Math.random() * 90000).toString();
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // انقضا پس از ۲ دقیقه

  // حذف کدهای قبلی و ذخیره کد جدید
  await prisma.verificationCode.deleteMany({ where: { mobile } });
  await prisma.verificationCode.create({
    data: { mobile, code, expiresAt },
  });

  try {
    await sendBaleOtp({ mobile, code });
  } catch (error) {
    await prisma.verificationCode.deleteMany({
      where: { mobile, code },
    });

    console.error(
      "Bale OTP delivery failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error:
        error instanceof Error && error.message === "BALE_NOT_CONFIGURED"
          ? "تنظیمات ربات بله کامل نشده است."
          : "ارسال کد در بله انجام نشد. لطفاً دوباره تلاش کنید.",
    };
  }
  console.log(`\n=================================`);
  console.log(`🔑 [OTP CODE] Mobile: ${mobile} | Code: ${code}`);
  console.log(`=================================\n`);


  return { success: true };
}

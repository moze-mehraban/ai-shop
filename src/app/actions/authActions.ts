'use server';

import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { MOBILE_PATTERN, normalizeMobile } from "@/lib/digits";
import { sendSmsIrOtp } from "@/lib/smsir";

const MAX_CODES_PER_HOUR = 5;

export async function requestOtpAction(rawMobile: string) {
  const mobile = normalizeMobile(String(rawMobile ?? ""));

  if (!MOBILE_PATTERN.test(mobile)) {
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

  // محدودیت تعداد درخواست کد در هر ساعت (جلوگیری از هدر رفتن اعتبار پیامک)
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  await prisma.verificationCode.deleteMany({
    where: { mobile, createdAt: { lt: hourAgo } },
  });
  const codesThisHour = await prisma.verificationCode.count({
    where: { mobile },
  });

  if (codesThisHour >= MAX_CODES_PER_HOUR) {
    return {
      success: false,
      error: "تعداد درخواست‌ها زیاد است. لطفاً یک ساعت دیگر دوباره تلاش کنید.",
    };
  }

  // تولید کد ۵ رقمی تصادفی
  const code = randomInt(10000, 100000).toString();
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // انقضا پس از ۲ دقیقه

  // کدهای قبلی باطل می‌شوند (منقضی) ولی برای شمارش محدودیت ساعتی نگه داشته می‌شوند
  await prisma.verificationCode.updateMany({
    where: { mobile, expiresAt: { gt: new Date() } },
    data: { expiresAt: new Date() },
  });
  await prisma.verificationCode.create({
    data: { mobile, code, expiresAt },
  });

  try {
    await sendSmsIrOtp({ mobile, code });
  } catch (error) {
    await prisma.verificationCode.deleteMany({
      where: { mobile, code },
    });

    console.error(
      "SMS OTP delivery failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error:
        error instanceof Error && error.message === "SMSIR_NOT_CONFIGURED"
          ? "تنظیمات سرویس پیامک کامل نشده است."
          : "ارسال پیامک انجام نشد. لطفاً دوباره تلاش کنید.",
    };
  }
  console.log(`\n=================================`);
  console.log(`🔑 [OTP CODE] Mobile: ${mobile} | Code: ${code}`);
  console.log(`=================================\n`);


  return { success: true, mobile };
}

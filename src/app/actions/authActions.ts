'use server';

import { prisma } from "@/lib/prisma";

export async function requestOtpAction(mobile: string) {
  if (!/^09\d{9}$/.test(mobile)) {
    return { success: false, error: "شماره موبایل نامعتبر است. (مثال: 09123456789)" };
  }

  // تولید کد ۵ رقمی تصادفی
  const code = Math.floor(10000 + Math.random() * 90000).toString();
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // انقضا پس از ۲ دقیقه

  // حذف کدهای قبلی و ذخیره کد جدید
  await prisma.verificationCode.deleteMany({ where: { mobile } });
  await prisma.verificationCode.create({
    data: { mobile, code, expiresAt },
  });

  // چاپ کد تایید فقط در کنسول/ترمینال سرور
  console.log(`\n=================================`);
  console.log(`🔑 [OTP CODE] Mobile: ${mobile} | Code: ${code}`);
  console.log(`=================================\n`);

  return { success: true };
}
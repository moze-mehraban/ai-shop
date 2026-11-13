"use server";

import { authOptions } from "@/lib/auth";
import { MOBILE_PATTERN, normalizeDigits, normalizeMobile, POSTAL_CODE_PATTERN } from "@/lib/digits";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export type AddressInput = {
  id?: string;
  title?: string;
  recipientName: string;
  mobile: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  isDefault?: boolean;
};

export type AddressResult =
  | { success: true; addressId: string }
  | { success: false; message: string };

function clean(value: unknown, max = 300) {
  return String(value ?? "").trim().slice(0, max);
}

export async function saveAddressAction(input: AddressInput): Promise<AddressResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: "ابتدا وارد حساب کاربری شوید." };
  }

  const data = {
    title: clean(input.title, 40) || null,
    recipientName: clean(input.recipientName, 80),
    mobile: normalizeMobile(clean(input.mobile, 20)),
    province: clean(input.province, 40),
    city: clean(input.city, 60),
    address: clean(input.address, 400),
    postalCode: normalizeDigits(clean(input.postalCode, 20)).replace(/\D/g, ""),
  };

  if (data.recipientName.length < 3) return { success: false, message: "نام و نام خانوادگی گیرنده را کامل وارد کنید." };
  if (!MOBILE_PATTERN.test(data.mobile)) return { success: false, message: "شماره موبایل گیرنده معتبر نیست." };
  if (data.province.length < 2 || data.city.length < 2) return { success: false, message: "استان و شهر را وارد کنید." };
  if (data.address.length < 10) return { success: false, message: "آدرس پستی را کامل‌تر وارد کنید." };
  if (!POSTAL_CODE_PATTERN.test(data.postalCode)) return { success: false, message: "کد پستی باید ۱۰ رقم باشد." };

  const userId = session.user.id;
  const count = await prisma.address.count({ where: { userId } });
  if (!input.id && count >= 20) {
    return { success: false, message: "حداکثر ۲۰ آدرس می‌توانید ذخیره کنید." };
  }
  const makeDefault = Boolean(input.isDefault) || count === 0;

  const address = await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    if (input.id) {
      const existing = await tx.address.findFirst({ where: { id: input.id, userId } });
      if (!existing) return null;
      return tx.address.update({
        where: { id: input.id },
        data: { ...data, ...(makeDefault ? { isDefault: true } : {}) },
      });
    }
    return tx.address.create({ data: { ...data, userId, isDefault: makeDefault } });
  });

  if (!address) return { success: false, message: "آدرس پیدا نشد." };

  revalidatePath("/profile/addresses");
  revalidatePath("/checkout");
  return { success: true, addressId: address.id };
}

export async function deleteAddressAction(addressId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;

  await prisma.address.deleteMany({ where: { id: addressId, userId: session.user.id } });

  // اگر آدرس پیش‌فرض حذف شد، جدیدترین آدرس پیش‌فرض شود
  const hasDefault = await prisma.address.count({ where: { userId: session.user.id, isDefault: true } });
  if (!hasDefault) {
    const latest = await prisma.address.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    if (latest) await prisma.address.update({ where: { id: latest.id }, data: { isDefault: true } });
  }

  revalidatePath("/profile/addresses");
  revalidatePath("/checkout");
}

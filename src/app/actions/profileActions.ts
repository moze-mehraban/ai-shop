"use server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export type ProfileActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function updateProfileAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "نشست شما منقضی شده است. لطفاً دوباره وارد شوید.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (name.length < 2 || name.length > 80) {
    return {
      status: "error",
      message: "نام باید بین ۲ تا ۸۰ کاراکتر باشد.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
    return {
      status: "error",
      message: "یک ایمیل معتبر وارد کنید.",
    };
  }

  const emailOwner = await prisma.user.findFirst({
    where: {
      email,
      id: { not: session.user.id },
    },
    select: { id: true },
  });

  if (emailOwner) {
    return {
      status: "error",
      message: "این ایمیل قبلاً توسط حساب دیگری استفاده شده است.",
    };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, email },
  });

  revalidatePath("/profile");
  revalidatePath("/admin/users");

  return {
    status: "success",
    message: "اطلاعات حساب شما با موفقیت ذخیره شد.",
  };
}

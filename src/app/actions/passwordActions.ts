"use server";

import { authOptions } from "@/lib/auth";
import { hashPassword, isRecentOtpLogin, passwordProblem, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export type PasswordState = { ok: boolean; message: string };

export async function setPasswordAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, message: "ابتدا وارد حساب کاربری شوید." };

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { password: true } });
  if (!user) return { ok: false, message: "حساب کاربری پیدا نشد." };

  if (user.password) {
    // تا ۱۵ دقیقه بعد از ورود با کد پیامکی، رمز جدید بدون رمز قبلی قابل تنظیم است (فراموشی رمز)
    if (!isRecentOtpLogin(session) && !(await verifyPassword(current, user.password))) {
      return {
        ok: false,
        message: "رمز عبور فعلی اشتباه است. اگر آن را فراموش کرده‌اید، خارج شوید و با کد پیامکی وارد شوید.",
      };
    }
  }

  const problem = passwordProblem(next);
  if (problem) return { ok: false, message: problem };
  if (next !== confirm) return { ok: false, message: "تکرار رمز عبور با رمز جدید یکسان نیست." };

  await prisma.user.update({ where: { id: session.user.id }, data: { password: await hashPassword(next) } });
  revalidatePath("/profile");
  return {
    ok: true,
    message: user.password ? "رمز عبور تغییر کرد." : "رمز عبور تنظیم شد. از این به بعد می‌توانید با رمز عبور هم وارد شوید.",
  };
}

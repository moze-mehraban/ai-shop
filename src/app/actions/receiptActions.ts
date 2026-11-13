"use server";

import { requireAdmin } from "@/lib/admin";
import { authOptions } from "@/lib/auth";
import { normalizeDigits } from "@/lib/digits";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { sendSmsIrTemplate } from "@/lib/smsir";
import { RECEIPT_DIR, saveReceiptImage } from "@/lib/uploads";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { unlink } from "node:fs/promises";
import path from "node:path";

export type ReceiptState = { ok: boolean; message: string };

async function removeReceiptFile(name: string | null) {
  if (name && /^[0-9a-f-]{36}\.webp$/.test(name)) {
    await unlink(path.join(RECEIPT_DIR, name)).catch(() => undefined);
  }
}

// مشتری: ارسال تصویر رسید کارت‌به‌کارت برای سفارش در انتظار پرداخت
export async function uploadReceiptAction(_prev: ReceiptState, formData: FormData): Promise<ReceiptState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, message: "ابتدا وارد حساب کاربری شوید." };

  const orderId = String(formData.get("orderId") ?? "");
  const reference = normalizeDigits(String(formData.get("reference") ?? "")).trim().slice(0, 60);
  const file = formData.get("receipt");

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    select: { id: true, status: true, receiptPath: true },
  });
  if (!order) return { ok: false, message: "سفارش پیدا نشد." };
  if (order.status !== "PENDING") return { ok: false, message: "این سفارش دیگر در انتظار پرداخت نیست." };
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "تصویر رسید را انتخاب کنید." };

  let receiptPath: string;
  try {
    receiptPath = await saveReceiptImage(file);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "آپلود رسید انجام نشد." };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { receiptPath, receiptRef: reference || null, receiptUploadedAt: new Date(), receiptRejectNote: null },
  });
  await removeReceiptFile(order.receiptPath);

  const settings = await getSettings();
  await sendSmsIrTemplate({
    mobile: settings.adminMobile,
    templateEnv: "SMSIR_ADMIN_RECEIPT_TEMPLATE_ID",
    parameters: { ORDER: order.id.slice(-8).toUpperCase() },
  });

  revalidatePath(`/profile/orders/${order.id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);
  return { ok: true, message: "رسید ارسال شد. پس از تأیید پرداخت، سفارش شما آماده ارسال می‌شود." };
}

// مدیر: رد رسید (مشتری می‌تواند رسید درست را دوباره بفرستد)
export async function rejectReceiptAction(formData: FormData) {
  await requireAdmin("/admin/orders");

  const orderId = String(formData.get("orderId") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 300) || "رسید قابل تأیید نبود؛ لطفاً رسید صحیح را ارسال کنید.";

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, receiptPath: true, recipientMobile: true, user: { select: { mobile: true } } },
  });
  if (!order || order.status !== "PENDING" || !order.receiptPath) return;

  await prisma.order.update({ where: { id: order.id }, data: { receiptRejectNote: note } });

  const mobile = order.recipientMobile || order.user.mobile;
  if (mobile) {
    await sendSmsIrTemplate({
      mobile,
      templateEnv: "SMSIR_STATUS_TEMPLATE_ID",
      parameters: { ORDER: order.id.slice(-8).toUpperCase(), STATUS: "رسید پرداخت رد شد", TRACKING: "-" },
    });
  }

  revalidatePath(`/profile/orders/${order.id}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);
}

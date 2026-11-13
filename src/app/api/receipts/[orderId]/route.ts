import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RECEIPT_DIR } from "@/lib/uploads";
import { getServerSession } from "next-auth";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

// تصویر رسید فقط برای صاحب سفارش و مدیر قابل مشاهده است
export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response("Not found", { status: 404 });

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true, receiptPath: true } });
  const allowed = order && (order.userId === session.user.id || session.user.role === "ADMIN");
  if (!allowed || !order.receiptPath || !/^[0-9a-f-]{36}\.webp$/.test(order.receiptPath)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await readFile(path.join(RECEIPT_DIR, order.receiptPath));
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

import { expireUnpaidOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * لغو سفارش‌های پرداخت‌نشده منقضی‌شده؛ برای اجرای زمان‌بندی‌شده با یک سرویس cron خارجی.
 * نیازمند CRON_SECRET در .env:  GET /api/cron/expire-orders?key=<CRON_SECRET>
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const key = new URL(request.url).searchParams.get("key");

  if (!secret || key !== secret) {
    return new Response("Not found", { status: 404 });
  }

  const canceled = await expireUnpaidOrders({ force: true });
  return Response.json({ canceled });
}

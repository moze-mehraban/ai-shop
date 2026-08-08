import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Clock, CheckCircle2, XCircle, ShoppingBag, ArrowRight } from "lucide-react";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  // دریافت سفارش‌های کاربر از دیتابیس همراه با محصولات هر سفارش
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: { label: "در انتظار پرداخت", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
    PAID: { label: "پرداخت شده", color: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
    SHIPPED: { label: "ارسال شده", color: "bg-purple-50 text-purple-700 border-purple-200", icon: Package },
    DELIVERED: { label: "تحویل داده شده", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    CANCELED: { label: "لغو شده", color: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* هدر صفحه */}
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-[#ef394e]/10 p-3 rounded-xl text-[#ef394e]">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">سفارش‌های من</h1>
              <p className="text-xs text-slate-500">تاریخچه و وضعیت پیگیری سفارش‌های ثبت شده</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#ef394e] transition-colors"
          >
            <span>بازگشت به فروشگاه</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* لیست سفارش‌ها */}
        {orders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="font-bold text-slate-800">هنوز سفارشی ثبت نکرده‌اید</h2>
              <p className="text-xs text-slate-500">محصولات متنوع فروشگاه را بررسی کنید و اولین سفارش خود را ثبت کنید.</p>
            </div>
            <Link
              href="/"
              className="inline-block bg-[#ef394e] text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-[#ef394e]/20 hover:bg-[#d82a3f] transition-colors"
            >
              مشاهده محصولات
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order:any) => {
              const statusInfo = statusMap[order.status] || statusMap.PENDING;
              const StatusIcon = statusInfo.icon;
              
              return (
                <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 text-xs">
                    <div className="flex items-center gap-4 text-slate-500">
                      <span>کد سفارش: <strong className="font-mono text-slate-700">{order.id.slice(-8)}</strong></span>
                      <span>•</span>
                      <span>تاریخ: {new Date(order.createdAt).toLocaleDateString('fa-IR')}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-bold ${statusInfo.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusInfo.label}</span>
                    </div>
                  </div>

                  {/* آیتم‌های سفارش */}
                  <div className="space-y-3">
                    {order.items.map((item:any) => (
                      <div key={item.id} className="flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-400 shrink-0 overflow-hidden">
                            {item.product.imageUrl ? (
                              <img src={item.product.imageUrl} alt={item.product.title} className="w-full h-full object-cover" />
                            ) : (
                              <span>AI</span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800">{item.product.title}</h3>
                            <p className="text-slate-400 text-[11px] pt-0.5">تعداد: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-700">
                          {(item.price * item.quantity).toLocaleString()} تومان
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* جمع کل */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">مبلغ کل پرداخت‌شده:</span>
                    <span className="font-bold text-sm text-slate-900">{order.totalAmount.toLocaleString()} تومان</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
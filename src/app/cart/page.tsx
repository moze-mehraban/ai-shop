"use client";

import { createOrderAction } from "@/app/actions/orderActions";
import { useCart } from "@/components/CartProvider";
import DigikalaHeader from "@/components/DigikalaHeader";
import {
  ArrowRight,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function CartPage() {
  const {
    items,
    itemCount,
    totalPrice,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const { status } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const handleCheckout = () => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=%2Fcart");
      return;
    }

    startTransition(async () => {
      setMessage("");
      const result = await createOrderAction(
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      );

      if (result.requiresLogin) {
        router.push("/login?callbackUrl=%2Fcart");
        return;
      }

      setMessage(result.message);

      if (result.success) {
        clearCart();
        router.push("/profile/orders");
        router.refresh();
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-800">
      <DigikalaHeader />

      <main className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#ef394e]">خرید شما</p>
            <h1 className="mt-1 text-2xl font-black text-slate-900">
              سبد خرید
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {itemCount.toLocaleString("fa-IR")} کالا در سبد شما
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#ef394e]"
          >
            <ArrowRight className="h-4 w-4" />
            ادامه خرید
          </Link>
        </div>

        {items.length === 0 ? (
          <section className="flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white px-5 text-center shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-300">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h2 className="mt-6 text-xl font-black text-slate-900">
              سبد خرید شما خالی است
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              محصولات مورد علاقه‌تان را پیدا کنید و به سبد اضافه کنید.
            </p>
            <Link
              href="/"
              className="mt-6 rounded-2xl bg-[#ef394e] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-rose-200 transition hover:bg-[#d82a3d]"
            >
              مشاهده محصولات
            </Link>
          </section>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-5">
                <h2 className="font-black text-slate-900">کالاهای سبد</h2>
                <button
                  type="button"
                  onClick={clearCart}
                  className="flex items-center gap-1.5 text-xs font-bold text-rose-500 transition hover:text-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                  پاک کردن سبد
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <article
                    key={item.productId}
                    className="grid gap-5 py-6 first:pt-2 last:pb-2 sm:grid-cols-[130px_minmax(0,1fr)]"
                  >
                    <Link
                      href={`/product/${item.productId}`}
                      className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100"
                    >
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          unoptimized
                          sizes="130px"
                          className="object-cover transition hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                          بدون تصویر
                        </div>
                      )}
                    </Link>

                    <div className="flex min-w-0 flex-col justify-between gap-5">
                      <div>
                        <Link
                          href={`/product/${item.productId}`}
                          className="line-clamp-2 text-sm leading-7 font-black text-slate-800 transition hover:text-[#ef394e]"
                        >
                          {item.title}
                        </Link>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            ضمانت اصالت کالا
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Truck className="h-4 w-4 text-sky-500" />
                            ارسال سریع
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
                          <button
                            type="button"
                            aria-label="افزایش تعداد"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.quantity + 1,
                              )
                            }
                            disabled={item.quantity >= item.stock}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#ef394e] transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <span className="w-9 text-center text-sm font-black">
                            {item.quantity.toLocaleString("fa-IR")}
                          </span>
                          <button
                            type="button"
                            aria-label={
                              item.quantity === 1 ? "حذف کالا" : "کاهش تعداد"
                            }
                            onClick={() =>
                              item.quantity === 1
                                ? removeItem(item.productId)
                                : updateQuantity(
                                    item.productId,
                                    item.quantity - 1,
                                  )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#ef394e] transition hover:bg-white"
                          >
                            {item.quantity === 1 ? (
                              <Trash2 className="h-4 w-4" />
                            ) : (
                              <Minus className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        <div className="text-left">
                          <strong className="text-lg font-black text-slate-900">
                            {(item.price * item.quantity).toLocaleString(
                              "fa-IR",
                            )}
                          </strong>
                          <span className="mr-1 text-xs text-slate-500">
                            تومان
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-28">
              <h2 className="text-lg font-black text-slate-900">خلاصه سفارش</h2>
              <dl className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between text-slate-500">
                  <dt>قیمت کالاها ({itemCount.toLocaleString("fa-IR")})</dt>
                  <dd>{totalPrice.toLocaleString("fa-IR")} تومان</dd>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <dt>هزینه ارسال</dt>
                  <dd className="font-bold text-emerald-600">رایگان</dd>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                  <dt className="font-black text-slate-900">مبلغ قابل پرداخت</dt>
                  <dd className="text-left">
                    <strong className="text-xl font-black text-slate-900">
                      {totalPrice.toLocaleString("fa-IR")}
                    </strong>
                    <span className="mr-1 text-xs text-slate-500">تومان</span>
                  </dd>
                </div>
              </dl>

              {message && (
                <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-center text-xs font-bold leading-6 text-rose-600">
                  {message}
                </p>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isPending || status === "loading"}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ef394e] px-4 py-4 text-sm font-bold text-white shadow-lg shadow-rose-200 transition hover:bg-[#d82a3d] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    در حال ثبت سفارش...
                  </>
                ) : status === "unauthenticated" ? (
                  "ورود و ادامه ثبت سفارش"
                ) : (
                  "ثبت سفارش"
                )}
              </button>

              <p className="mt-4 text-center text-[11px] leading-6 text-slate-400">
                قیمت و موجودی کالا هنگام ثبت سفارش دوباره بررسی می‌شود.
              </p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

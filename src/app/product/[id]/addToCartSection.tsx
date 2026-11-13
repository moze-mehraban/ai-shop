"use client";

import { toggleStockNotificationAction } from "@/app/actions/stockActions";
import { useCart } from "@/components/CartProvider";
import { getDiscountedPrice } from "@/lib/pricing";
import {
  BellOff,
  BellRing,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Variant = {
  id: string;
  name: string;
  price: number | null;
  stock: number;
};

interface AddToCartProps {
  productId: string;
  productTitle: string;
  imageUrl: string | null;
  price: number;
  discountPercent: number;
  stock: number;
  variants?: Variant[];
  notifySubscribed?: boolean;
}

export default function AddToCartSection({
  productId,
  productTitle,
  imageUrl,
  price,
  discountPercent,
  stock,
  variants = [],
  notifySubscribed = false,
}: AddToCartProps) {
  const { addItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [subscribed, setSubscribed] = useState(notifySubscribed);
  const [isPending, startTransition] = useTransition();
  const [variantId, setVariantId] = useState<string | null>(
    variants.find((variant) => variant.stock > 0)?.id ?? variants[0]?.id ?? null,
  );

  const variant = variants.find((item) => item.id === variantId) ?? null;
  const basePrice = variant?.price ?? price;
  const availableStock = variant ? variant.stock : stock;
  const isOutOfStock = availableStock <= 0;
  const hasDiscount = discountPercent > 0;
  const displayPrice = getDiscountedPrice(basePrice, discountPercent);

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addItem(
      {
        productId,
        variantId: variant?.id ?? null,
        variantName: variant?.name ?? null,
        title: productTitle,
        imageUrl,
        price: displayPrice,
        stock: availableStock,
      },
      quantity,
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  const handleNotify = () => {
    startTransition(async () => {
      const result = await toggleStockNotificationAction(productId);
      if (result.requiresLogin) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/product/${productId}`)}`);
        return;
      }
      if (result.success) setSubscribed(result.subscribed);
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {variants.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-bold text-slate-700">
            انتخاب نوع: <span className="text-ink">{variant?.name}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setVariantId(item.id);
                  setQuantity(1);
                }}
                aria-pressed={item.id === variantId}
                className={`rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition ${
                  item.id === variantId
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                } ${item.stock <= 0 ? "opacity-50 line-through" : ""}`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex w-full flex-col justify-center text-right">
          {isOutOfStock ? (
            <span className="text-xl font-bold text-slate-400">ناموجود</span>
          ) : (
            <>
              {hasDiscount && (
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-md bg-brand-400 px-2 py-0.5 text-[11px] font-bold text-brand-900">
                    {discountPercent.toLocaleString("fa-IR")}٪
                  </span>
                  <span className="text-sm text-slate-400 line-through">
                    {basePrice.toLocaleString("fa-IR")}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-ink">
                  {displayPrice.toLocaleString("fa-IR")}
                </span>
                <span className="text-sm font-medium text-slate-500">تومان</span>
              </div>
              {availableStock <= 5 && (
                <span className="mt-1 text-xs font-bold text-orange-600">
                  تنها {availableStock.toLocaleString("fa-IR")} عدد در انبار باقی مانده
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex h-14 w-full gap-3">
          {isOutOfStock ? (
            <button
              type="button"
              onClick={handleNotify}
              disabled={isPending}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 px-4 font-bold transition-all ${
                subscribed
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : subscribed ? (
                <BellOff className="h-5 w-5" />
              ) : (
                <BellRing className="h-5 w-5" />
              )}
              {subscribed ? "به شما خبر می‌دهیم (لغو)" : "موجود شد خبرم کن"}
            </button>
          ) : (
            <>
              <div className="flex shrink-0 items-center rounded-2xl border border-slate-200 bg-white px-2">
                <button
                  type="button"
                  aria-label="افزایش تعداد"
                  onClick={() => setQuantity((current) => Math.min(availableStock, current + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-all hover:bg-slate-100"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-lg font-bold text-slate-800">
                  {quantity.toLocaleString("fa-IR")}
                </span>
                <button
                  type="button"
                  aria-label="کاهش تعداد"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-all hover:bg-slate-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl font-bold shadow-lg transition-all active:scale-95 ${
                  added
                    ? "bg-emerald-500 text-white shadow-emerald-200"
                    : "bg-brand-400 text-brand-900 shadow-brand-500/30 hover:bg-brand-500 hover:text-white"
                }`}
              >
                {added ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    به سبد اضافه شد
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    افزودن به سبد
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

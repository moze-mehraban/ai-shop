"use client";

import { useCart } from "@/components/CartProvider";
import {
  BellRing,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";

interface AddToCartProps {
  productId: string;
  productTitle: string;
  imageUrl: string | null;
  price: number;
  discountPrice?: number;
  stock: number;
}

export default function AddToCartSection({
  productId,
  productTitle,
  imageUrl,
  price,
  discountPrice,
  stock,
}: AddToCartProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const isOutOfStock = stock <= 0;
  const hasDiscount =
    typeof discountPrice === "number" && discountPrice < price;
  const displayPrice = hasDiscount ? discountPrice : price;
  const discountPercent = hasDiscount
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      return;
    }

    addItem(
      {
        productId,
        title: productTitle,
        imageUrl,
        price: displayPrice,
        stock,
      },
      quantity,
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex w-full flex-col justify-center text-right sm:w-auto">
          {isOutOfStock ? (
            <span className="text-xl font-bold text-slate-400">ناموجود</span>
          ) : (
            <>
              {hasDiscount && (
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-md bg-[#ef394e] px-2 py-0.5 text-[11px] font-bold text-white">
                    {discountPercent}٪
                  </span>
                  <span className="text-sm text-slate-400 line-through">
                    {price.toLocaleString("fa-IR")}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-slate-800">
                  {displayPrice.toLocaleString("fa-IR")}
                </span>
                <span className="text-sm font-medium text-slate-500">تومان</span>
              </div>
            </>
          )}
        </div>

        <div className="flex h-14 w-full gap-3 sm:w-auto">
          {isOutOfStock ? (
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white font-bold text-slate-600 transition-all hover:border-slate-300 sm:w-[220px]"
            >
              <BellRing className="h-5 w-5" />
              موجود شد خبرم کن
            </button>
          ) : (
            <>
              <div className="flex shrink-0 items-center rounded-2xl border border-slate-200 bg-white px-2">
                <button
                  type="button"
                  aria-label="افزایش تعداد"
                  onClick={() =>
                    setQuantity((current) => Math.min(stock, current + 1))
                  }
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
                  onClick={() =>
                    setQuantity((current) => Math.max(1, current - 1))
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-all hover:bg-slate-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 sm:w-[210px] ${
                  added
                    ? "bg-emerald-600 shadow-emerald-200"
                    : "bg-[#ef394e] shadow-[#ef394e]/30 hover:bg-[#d82a3d]"
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

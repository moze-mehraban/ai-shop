"use client";

import { toggleWishlistAction } from "@/app/actions/wishlistActions";
import { Heart, Loader2, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type WishlistButtonProps = {
  productId: string;
  initialWishlisted: boolean;
  variant?: "default" | "remove";
};

export default function WishlistButton({
  productId,
  initialWishlisted,
  variant = "default",
}: WishlistButtonProps) {
  const { status } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [message, setMessage] = useState("");

  const handleToggle = () => {
    if (status === "unauthenticated") {
      router.push(
        `/login?callbackUrl=${encodeURIComponent(`/product/${productId}`)}`,
      );
      return;
    }

    startTransition(async () => {
      const result = await toggleWishlistAction(productId);

      if (result.requiresLogin) {
        router.push(
          `/login?callbackUrl=${encodeURIComponent(`/product/${productId}`)}`,
        );
        return;
      }

      setMessage(result.message);

      if (result.success) {
        setIsWishlisted(result.isWishlisted);
        router.refresh();
      }
    });
  };

  if (variant === "remove") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending || status === "loading"}
        className="flex items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        حذف
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending || status === "loading"}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isWishlisted
            ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
            : "border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:text-rose-600"
        }`}
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Heart
            className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`}
          />
        )}
        {isWishlisted
          ? "حذف از علاقه‌مندی‌ها"
          : status === "unauthenticated"
            ? "ورود و افزودن به علاقه‌مندی‌ها"
            : "افزودن به علاقه‌مندی‌ها"}
      </button>
      {message && (
        <p className="mt-2 text-center text-[11px] font-bold text-slate-500">
          {message}
        </p>
      )}
    </div>
  );
}

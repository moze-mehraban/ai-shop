"use client";

import {
  type GenerateSummaryState,
  generateProductSummaryAction,
} from "@/app/actions/adminActions";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

const initialState: GenerateSummaryState = {
  status: "idle",
  message: "",
};

export default function GenerateSummaryButton({
  productId,
  reviewCount,
}: {
  productId: string;
  reviewCount: number;
}) {
  const router = useRouter();
  const action = generateProductSummaryAction.bind(null, productId);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-purple-200 bg-purple-50 p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs font-black text-purple-800">
            <Sparkles className="h-4 w-4" />
            خلاصه‌سازی دیدگاه‌ها با OpenRouter
          </p>
          <p className="mt-1 text-[11px] leading-6 text-purple-600">
            {reviewCount.toLocaleString("fa-IR")} دیدگاه آخر تحلیل می‌شود و
            خلاصه فعلی محصول جایگزین خواهد شد.
          </p>
        </div>
        <button
          type="submit"
          disabled={pending || reviewCount === 0}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 py-3 text-xs font-bold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {pending ? "در حال تحلیل..." : "ساخت خلاصه هوشمند"}
        </button>
      </div>

      {state.message && (
        <p
          aria-live="polite"
          className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold ${
            state.status === "success"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {state.status === "success" && (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {state.message}
        </p>
      )}
    </form>
  );
}

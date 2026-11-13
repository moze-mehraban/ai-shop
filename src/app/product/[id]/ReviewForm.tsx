"use client";

import {
  addReviewAction,
  type ReviewActionState,
} from "@/app/actions/reviewActions";
import { Loader2, LogIn, Send, Star } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

interface ReviewFormProps {
  productId: string;
}

const ratingLabels = [
  "خیلی ضعیف",
  "ضعیف",
  "معمولی",
  "خوب",
  "عالی",
];

const initialReviewState: ReviewActionState = {
  status: "idle",
  message: "",
};

export default function ReviewForm({ productId }: ReviewFormProps) {
  const { status } = useSession();
  const [rating, setRating] = useState(5);
  const formRef = useRef<HTMLFormElement>(null);
  const action = addReviewAction.bind(null, productId);
  const [state, formAction, pending] = useActionState(
    action,
    initialReviewState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  if (status === "loading") {
    return (
      <div className="flex min-h-32 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="card rounded-2xl p-5">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <LogIn className="h-6 w-6" />
        </div>
        <h3 className="text-base font-black text-ink">
          تجربه‌تان را به اشتراک بگذارید
        </h3>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          برای امتیاز دادن و ثبت دیدگاه، ابتدا وارد حساب کاربری خود شوید.
        </p>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(`/product/${productId}`)}`}
          className="btn-primary mt-4 w-full py-2.5"
        >
          <LogIn className="h-4 w-4" />
          ورود و ثبت دیدگاه
        </Link>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="card rounded-2xl p-5"
    >
      <div className="mb-4">
        <p className="text-xs font-bold text-brand-600">نظر شما مهم است</p>
        <h3 className="mt-1 text-base font-black text-ink">
          ثبت دیدگاه جدید
        </h3>
        <p className="mt-2 text-xs leading-6 text-slate-500">
          تجربه واقعی شما به دیگران برای انتخاب بهتر کمک می‌کند.
        </p>
      </div>

      <fieldset disabled={pending}>
        <legend className="mb-3 text-sm font-bold text-slate-700">
          امتیاز شما
        </legend>
        <input type="hidden" name="rating" value={rating} />
        <div className="flex items-center gap-3">
          <div className="flex gap-1" dir="ltr">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                aria-label={`${star} ستاره`}
                className="rounded-lg p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <Star
                  className={`h-7 w-7 ${
                    star <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-250 fill-slate-100"
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            {ratingLabels[rating - 1]}
          </span>
        </div>

        <label
          htmlFor="review-content"
          className="mt-6 mb-2 block text-sm font-bold text-slate-700"
        >
          متن دیدگاه
        </label>
        <textarea
          id="review-content"
          name="content"
          minLength={10}
          maxLength={1000}
          rows={6}
          required
          placeholder="کیفیت، نقاط قوت و تجربه استفاده از محصول را بنویسید..."
          className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
        />
      </fieldset>

      <div aria-live="polite" className="min-h-7">
        {state.message && (
          <p
            className={`mt-2 text-xs font-bold ${
              state.status === "success" ? "text-emerald-600" : "text-brand-700"
            }`}
          >
            {state.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-400 px-4 py-3.5 text-sm font-bold text-brand-900 shadow-lg shadow-brand-500/25 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            در حال ثبت دیدگاه...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            ثبت دیدگاه
          </>
        )}
      </button>
    </form>
  );
}

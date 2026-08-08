'use client';

import { useState } from "react";
import { submitReviewAction } from "@/app/actions/reviewActions";
import { Star, Sparkles, Loader2 } from "lucide-react";

interface ReviewFormProps {
  productId: string;
}

export default function ReviewForm({ productId }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setMessage("");

    const res = await submitReviewAction(productId, content, rating);
    setLoading(false);

    if (res.success) {
      setContent("");
      setMessage("نظر شما با موفقیت ثبت و توسط AI تحلیل شد.");
    } else {
      setMessage("خطایی در ثبت نظر رخ داد.");
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
      <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
        <span>ثبت نظر جدید</span>
        <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
          <Sparkles className="w-3 h-3" />
          تحلیل هوشمند
        </span>
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">
            امتیاز شما به این محصول:
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5">
            متن نظر شما:
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="دیدگاه خود را بنویسید..."
            rows={3}
            required
            className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-3 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>در حال پردازش...</span>
            </>
          ) : (
            <span>ثبت نظر</span>
          )}
        </button>

        {message && (
          <p
            className={`text-xs text-center font-medium ${
              message.includes("موفقیت") ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
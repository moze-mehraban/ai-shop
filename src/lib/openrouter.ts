import "server-only";

type OpenRouterResponse = {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
  error?: {
    message?: string;
  };
};

export async function summarizeReviewsWithOpenRouter({
  productTitle,
  reviews,
}: {
  productTitle: string;
  reviews: { rating: number; content: string }[];
}) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model =
    process.env.OPENROUTER_MODEL?.trim() || "google/gemini-3.1-flash-lite";

  if (!apiKey) {
    throw new Error("OPENROUTER_NOT_CONFIGURED");
  }

  const reviewText = reviews
    .map(
      (review, index) =>
        `${index + 1}. امتیاز ${review.rating} از ۵: ${review.content}`,
    )
    .join("\n");

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-OpenRouter-Title": "AI-Shop Review Summarizer",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "شما تحلیل‌گر حرفه‌ای نظرات فروشگاه اینترنتی هستید. فقط به زبان فارسی پاسخ دهید. یک جمع‌بندی بی‌طرف، روان و کاربردی در ۳ تا ۵ جمله بنویسید. مهم‌ترین نقاط قوت، نقاط ضعف و میزان رضایت کلی را ذکر کنید. چیزی خارج از نظرات کاربران اختراع نکنید و از فهرست، تیتر و ایموجی استفاده نکنید.",
          },
          {
            role: "user",
            content: `محصول: ${productTitle}\n\nنظرات کاربران:\n${reviewText}`,
          },
        ],
        temperature: 0.25,
        max_tokens: 500,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    },
  );

  const result = (await response.json().catch(() => null)) as
    | OpenRouterResponse
    | null;
  const summary = result?.choices?.[0]?.message?.content?.trim();

  if (!response.ok || !summary) {
    throw new Error(result?.error?.message || "OPENROUTER_REQUEST_FAILED");
  }

  return summary;
}

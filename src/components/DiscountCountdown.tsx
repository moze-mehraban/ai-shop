"use client";

import { Timer } from "lucide-react";
import { useEffect, useState } from "react";

const fa = (value: number, pad = 2) => value.toString().padStart(pad, "0").replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);

// شمارش معکوس تا پایان تخفیف؛ قبل از اجرا در مرورگر چیزی نمایش نمی‌دهد (جلوگیری از ناهمخوانی SSR)
export default function DiscountCountdown({
  endsAt,
  variant = "badge",
}: {
  endsAt: string;
  variant?: "badge" | "inline";
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  if (now === null) return null;
  const remaining = new Date(endsAt).getTime() - now;
  if (remaining <= 0) return null;

  const seconds = Math.floor(remaining / 1000);
  const days = Math.floor(seconds / 86400);
  const clock = `${fa(Math.floor((seconds % 86400) / 3600))}:${fa(Math.floor((seconds % 3600) / 60))}:${fa(seconds % 60)}`;
  const label = days > 0 ? `${fa(days, 1)} روز و ${clock}` : clock;

  if (variant === "inline") {
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600" dir="rtl">
        <Timer className="h-3.5 w-3.5" />
        <span dir="ltr">{label}</span>
      </span>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
      <span className="flex items-center gap-1.5">
        <Timer className="h-4 w-4" />
        زمان باقی‌مانده تا پایان تخفیف
      </span>
      <span className="font-mono text-sm" dir="ltr">{label}</span>
    </div>
  );
}

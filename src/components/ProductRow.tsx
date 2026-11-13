"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// یک ردیف افقی از کارت‌ها؛ در موبایل با کشیدن انگشت و در دسکتاپ با دکمه‌های فلش جابه‌جا می‌شود
export default function ProductRow({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // در صفحه راست‌به‌چپ scrollLeft از ۰ به سمت منفی می‌رود
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const position = Math.abs(track.scrollLeft);
      setCanPrev(position > 24);
      setCanNext(position < max - 24);
    };
    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scroll = (direction: "prev" | "next") => {
    const track = trackRef.current;
    if (!track) return;
    const amount = track.clientWidth * 0.85;
    // «بعدی» در RTL یعنی حرکت به سمت چپ (scrollLeft منفی‌تر)
    track.scrollBy({ left: direction === "next" ? -amount : amount, behavior: "smooth" });
  };

  const button =
    "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[var(--shadow-card-hover)] transition hover:text-brand-700 md:flex";

  return (
    <div className="relative">
      {canPrev && (
        <button type="button" aria-label="قبلی" onClick={() => scroll("prev")} className={`${button} -right-4`}>
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
      <div
        ref={trackRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overflow-y-hidden scroll-smooth px-4 pt-1 pb-3 sm:gap-4"
      >
        {children}
      </div>
      {canNext && (
        <button type="button" aria-label="بعدی" onClick={() => scroll("next")} className={`${button} -left-4`}>
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export function ProductRowItem({ children }: { children: React.ReactNode }) {
  return <div className="w-[46%] shrink-0 snap-start sm:w-[31%] md:w-[23.5%] lg:w-[18.8%]">{children}</div>;
}

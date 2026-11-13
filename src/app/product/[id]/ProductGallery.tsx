"use client";

/* eslint-disable @next/next/no-img-element */
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { useState } from "react";

export default function ProductGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square flex-col items-center justify-center gap-3 rounded-3xl bg-slate-50 text-slate-300">
        <ImageIcon className="h-16 w-16" />
        <span className="text-sm font-medium">تصویر محصول</span>
      </div>
    );
  }

  const go = (step: number) =>
    setActive((current) => (current + step + images.length) % images.length);

  return (
    <div>
      <div className="group relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-b from-slate-50 to-white">
        <img
          src={images[active]}
          alt={title}
          className="h-full w-full object-contain p-8 mix-blend-multiply"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="تصویر قبلی"
              className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="تصویر بعدی"
              className="absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink/70 px-3 py-1 text-[11px] text-white">
              {(active + 1).toLocaleString("fa-IR")} از {images.length.toLocaleString("fa-IR")}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto overflow-y-hidden no-scrollbar pb-1">
          {images.map((image, index) => (
            <button
              key={image + index}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`نمایش تصویر ${index + 1}`}
              className={`h-18 w-18 shrink-0 overflow-hidden rounded-xl border-2 bg-slate-50 transition ${
                index === active ? "border-brand-500" : "border-transparent hover:border-slate-300"
              }`}
            >
              <img src={image} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

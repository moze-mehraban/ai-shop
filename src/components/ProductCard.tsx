/* eslint-disable @next/next/no-img-element */
import { getDiscountedPrice } from "@/lib/pricing";
import { Percent, Star } from "lucide-react";
import Link from "next/link";

type ProductCardProps = {
  product: {
    id: string;
    title: string;
    price: number;
    discountPercent: number;
    imageUrl: string | null;
    stock: number;
    category: {
      name: string;
    };
    reviews: {
      rating: number;
    }[];
  };
};

export default function ProductCard({ product }: ProductCardProps) {
  const finalPrice = getDiscountedPrice(
    product.price,
    product.discountPercent,
  );
  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
        product.reviews.length
      : 0;

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-slate-200/70 bg-white shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:border-slate-200 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-full w-full object-contain p-6 mix-blend-multiply transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-300">
            بدون تصویر
          </div>
        )}
        {product.discountPercent > 0 && (
          <span className="absolute top-3 right-3 flex items-center gap-0.5 rounded-full bg-brand-400 px-2.5 py-1 text-xs font-black text-brand-900 shadow-[var(--shadow-brand)]">
            {product.discountPercent.toLocaleString("fa-IR")}
            <Percent className="h-3 w-3" />
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute inset-x-3 bottom-3 rounded-xl bg-ink/85 py-2 text-center text-xs font-bold text-white backdrop-blur">
            ناموجود
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-medium text-slate-400">
          {product.category.name}
        </p>
        <h3 className="mt-1.5 line-clamp-2 min-h-12 text-sm leading-6 font-bold text-ink transition group-hover:text-brand-700">
          {product.title}
        </h3>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-4">
          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>
              {averageRating > 0
                ? averageRating.toLocaleString("fa-IR", {
                    maximumFractionDigits: 1,
                  })
                : "جدید"}
            </span>
          </div>

          <div className="text-left">
            {product.discountPercent > 0 && (
              <span className="block text-xs text-slate-400 line-through">
                {product.price.toLocaleString("fa-IR")}
              </span>
            )}
            <strong className="text-base font-black text-ink">
              {finalPrice.toLocaleString("fa-IR")}
            </strong>
            <span className="mr-1 text-[11px] text-slate-500">تومان</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

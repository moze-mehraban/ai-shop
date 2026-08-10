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
      className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div>
        <div className="relative mb-3 h-48 overflow-hidden rounded-xl bg-slate-50">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-300">
              بدون تصویر
            </div>
          )}
          {product.discountPercent > 0 && (
            <span className="absolute top-2 right-2 flex items-center gap-0.5 rounded-full bg-[#ef394e] px-2 py-1 text-xs font-black text-white shadow-sm">
              <Percent className="h-3 w-3" />
              {product.discountPercent.toLocaleString("fa-IR")}
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute inset-x-3 bottom-3 rounded-xl bg-slate-900/85 py-2 text-center text-xs font-bold text-white backdrop-blur">
              ناموجود
            </span>
          )}
        </div>

        <p className="text-[10px] font-bold text-slate-400">
          {product.category.name}
        </p>
        <h3 className="mt-1 line-clamp-2 min-h-12 text-sm leading-6 font-black text-slate-800">
          {product.title}
        </h3>
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
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
            <span className="block text-[10px] text-slate-400 line-through">
              {product.price.toLocaleString("fa-IR")}
            </span>
          )}
          <strong className="text-sm font-black text-slate-900">
            {finalPrice.toLocaleString("fa-IR")}
          </strong>
          <span className="mr-1 text-[10px] text-slate-400">تومان</span>
        </div>
      </div>
    </Link>
  );
}

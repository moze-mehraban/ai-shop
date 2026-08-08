import { deleteReviewAction } from "@/app/actions/adminActions";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { prisma } from "@/lib/prisma";
import {
  MessageSquareText,
  Sparkles,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function AdminReviewsPage() {
  const [reviews, aggregate, analyzedCount] = await Promise.all([
    prisma.review.findMany({
      include: {
        product: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            name: true,
            mobile: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.aggregate({
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.count({ where: { isAnalyzed: true } }),
  ]);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#ef394e]">کنترل محتوا</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">
            مدیریت دیدگاه‌ها
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            بازخورد کاربران را بررسی و محتوای نامناسب را حذف کنید.
          </p>
        </div>
        <div className="flex gap-3">
          <ReviewSummary
            icon={<MessageSquareText className="h-5 w-5" />}
            label="کل دیدگاه‌ها"
            value={aggregate._count._all.toLocaleString("fa-IR")}
          />
          <ReviewSummary
            icon={<Star className="h-5 w-5" />}
            label="میانگین امتیاز"
            value={(aggregate._avg.rating ?? 0).toLocaleString("fa-IR", {
              maximumFractionDigits: 1,
            })}
            amber
          />
          <ReviewSummary
            icon={<Sparkles className="h-5 w-5" />}
            label="تحلیل‌شده"
            value={analyzedCount.toLocaleString("fa-IR")}
            purple
          />
        </div>
      </div>

      <section className="space-y-4">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-black text-slate-800">
                    {review.user.name ||
                      review.user.mobile ||
                      review.user.email ||
                      "کاربر"}
                  </h2>
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700">
                    {review.rating.toLocaleString("fa-IR")}
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </span>
                  {review.isAnalyzed && (
                    <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-[10px] font-bold text-purple-700">
                      <Sparkles className="h-3 w-3" />
                      تحلیل‌شده
                    </span>
                  )}
                </div>
                <Link
                  href={`/product/${review.product.id}`}
                  className="mt-1 block truncate text-xs font-bold text-sky-600 hover:text-sky-700"
                >
                  {review.product.title}
                </Link>
                <p className="mt-4 text-sm leading-8 text-slate-600">
                  {review.content}
                </p>
                <p className="mt-3 text-[10px] text-slate-400">
                  {review.createdAt.toLocaleString("fa-IR")}
                </p>
              </div>
              <form action={deleteReviewAction}>
                <input type="hidden" name="reviewId" value={review.id} />
                <input
                  type="hidden"
                  name="productId"
                  value={review.productId}
                />
                <AdminSubmitButton
                  className="rounded-xl border border-rose-100 bg-rose-50 p-2.5 text-rose-500 transition hover:bg-rose-100"
                  pendingLabel=""
                >
                  <Trash2 className="h-4 w-4" />
                </AdminSubmitButton>
              </form>
            </div>
          </article>
        ))}

        {reviews.length === 0 && (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white text-center">
            <MessageSquareText className="h-10 w-10 text-slate-300" />
            <h2 className="mt-4 font-black text-slate-700">
              هنوز دیدگاهی ثبت نشده است
            </h2>
          </div>
        )}
      </section>
    </div>
  );
}

function ReviewSummary({
  icon,
  label,
  value,
  amber = false,
  purple = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  amber?: boolean;
  purple?: boolean;
}) {
  const color = amber
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : purple
      ? "border-purple-200 bg-purple-50 text-purple-700"
      : "border-slate-200 bg-white text-slate-600";

  return (
    <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${color}`}>
      {icon}
      <div>
        <p className="text-[10px] opacity-70">{label}</p>
        <p className="font-black">{value}</p>
      </div>
    </div>
  );
}

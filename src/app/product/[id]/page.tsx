import DigikalaHeader from "@/components/DigikalaHeader";
import WishlistButton from "@/components/WishlistButton";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  BadgeCheck,
  ChevronLeft,
  ImageIcon,
  MessageSquareText,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  UserCircle2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import AddToCartSection from "./addToCartSection";
import ReviewForm from "./ReviewForm";

export const revalidate = 0;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      reviews: {
        include: {
          user: {
            select: {
              name: true,
              orders: {
                where: {
                  status: {
                    in: ["PAID", "SHIPPED", "DELIVERED"],
                  },
                  items: {
                    some: {
                      productId: id,
                    },
                  },
                },
                select: { id: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const wishlistItem = session?.user?.id
    ? await prisma.wishlist.findUnique({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId: product.id,
          },
        },
        select: { id: true },
      })
    : null;

  const reviewCount = product.reviews.length;
  const averageRating =
    reviewCount > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviewCount
      : 0;
  const recommendedCount = product.reviews.filter(
    (review) => review.rating >= 4,
  ).length;
  const recommendationRate =
    reviewCount > 0 ? Math.round((recommendedCount / reviewCount) * 100) : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: product.reviews.filter((review) => review.rating === rating).length,
  }));

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-800" dir="rtl">
      <DigikalaHeader />

      <main className="mx-auto max-w-[1400px] px-4 py-6 md:py-8">
        <nav
          aria-label="مسیر صفحه"
          className="mb-5 flex items-center gap-1 overflow-hidden text-xs text-slate-500"
        >
          <Link href="/" className="shrink-0 transition hover:text-[#ef394e]">
            فروشگاه
          </Link>
          <ChevronLeft className="h-4 w-4 shrink-0 text-slate-300" />
          <span className="shrink-0">{product.category.name}</span>
          <ChevronLeft className="h-4 w-4 shrink-0 text-slate-300" />
          <span className="truncate font-medium text-slate-700">
            {product.title}
          </span>
        </nav>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
            <div className="p-5 md:p-8">
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    priority
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-300">
                    <ImageIcon className="h-16 w-16" />
                    <span className="text-sm font-medium">تصویر محصول</span>
                  </div>
                )}
                <span className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">
                  {product.category.name}
                </span>
              </div>
            </div>

            <div className="flex flex-col border-t border-slate-100 p-5 md:p-8 lg:border-t-0 lg:border-r">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {product.stock > 0 ? "موجود در انبار" : "ناموجود"}
                  </span>
                  <span className="text-xs text-slate-400">
                    کد کالا: {product.id.slice(-6).toUpperCase()}
                  </span>
                </div>

                <h1 className="text-2xl leading-10 font-black text-slate-900 md:text-3xl">
                  {product.title}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-slate-100 pb-6 text-sm">
                  <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <strong>
                      {reviewCount > 0
                        ? averageRating.toLocaleString("fa-IR", {
                            maximumFractionDigits: 1,
                          })
                        : "بدون امتیاز"}
                    </strong>
                  </div>
                  <a
                    href="#reviews"
                    className="flex items-center gap-1.5 text-sky-600 transition hover:text-sky-700"
                  >
                    <MessageSquareText className="h-4 w-4" />
                    {reviewCount.toLocaleString("fa-IR")} دیدگاه
                  </a>
                  {reviewCount > 0 && (
                    <span className="text-xs text-slate-500">
                      {recommendationRate.toLocaleString("fa-IR")}٪ خریداران
                      پیشنهاد می‌کنند
                    </span>
                  )}
                </div>

                <div className="py-6">
                  <h2 className="mb-3 text-sm font-black text-slate-900">
                    معرفی محصول
                  </h2>
                  <p className="text-sm leading-8 text-slate-600">
                    {product.description ||
                      "توضیحاتی برای این محصول ثبت نشده است."}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Feature
                    icon={<ShieldCheck className="h-5 w-5" />}
                    title="ضمانت اصالت"
                    subtitle="کالای اصل"
                    color="text-emerald-600"
                  />
                  <Feature
                    icon={<Truck className="h-5 w-5" />}
                    title="ارسال سریع"
                    subtitle="سراسر کشور"
                    color="text-rose-500"
                  />
                  <Feature
                    icon={<PackageCheck className="h-5 w-5" />}
                    title="موجودی واقعی"
                    subtitle={`${product.stock.toLocaleString("fa-IR")} عدد`}
                    color="text-sky-600"
                  />
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <AddToCartSection
                  productId={product.id}
                  productTitle={product.title}
                  imageUrl={product.imageUrl}
                  price={product.price}
                  discountPercent={product.discountPercent}
                  stock={product.stock}
                />
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <WishlistButton
                    productId={product.id}
                    initialWishlisted={Boolean(wishlistItem)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mt-6 overflow-hidden rounded-[2rem] bg-slate-900 p-6 text-white shadow-xl md:p-8">
          <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[#ef394e]/25 blur-3xl" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
              <Sparkles className="h-7 w-7 text-amber-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-black">خلاصه هوشمند دیدگاه‌ها</h2>
                <span className="rounded-full bg-[#ef394e] px-3 py-1 text-[10px] font-bold">
                  تحلیل AI
                </span>
              </div>
              <p className="mt-3 max-w-5xl text-sm leading-8 text-slate-300">
                {product.aiSummary ||
                  (reviewCount > 0
                    ? "دیدگاه‌های بیشتری لازم است تا خلاصه هوشمند و دقیق این محصول تولید شود."
                    : "پس از ثبت دیدگاه‌های خریداران، خلاصه هوشمند تجربه کاربران در این بخش نمایش داده می‌شود.")}
              </p>
            </div>
          </div>
        </section>

        <section id="reviews" className="mt-6 scroll-mt-28">
          <div className="mb-5">
            <p className="text-xs font-bold text-[#ef394e]">تجربه خریداران</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              امتیازها و دیدگاه‌ها
            </h2>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="space-y-5 lg:sticky lg:top-32">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black text-slate-900">
                    {reviewCount > 0
                      ? averageRating.toLocaleString("fa-IR", {
                          maximumFractionDigits: 1,
                        })
                      : "۰"}
                  </span>
                  <span className="pb-1 text-sm text-slate-400">از ۵</span>
                </div>
                <div className="mt-3 flex gap-1" dir="ltr">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(averageRating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-100 text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  بر اساس {reviewCount.toLocaleString("fa-IR")} دیدگاه
                </p>

                <div className="mt-6 space-y-3">
                  {ratingCounts.map(({ rating, count }) => (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="w-4 text-xs font-bold text-slate-500">
                        {rating.toLocaleString("fa-IR")}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{
                            width: `${
                              reviewCount > 0
                                ? Math.round((count / reviewCount) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="w-5 text-left text-[11px] text-slate-400">
                        {count.toLocaleString("fa-IR")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <ReviewForm productId={product.id} />
            </aside>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
              {product.reviews.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {product.reviews.map((review) => (
                    <article key={review.id} className="py-6 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <UserCircle2 className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-black text-slate-800">
                              {review.user.name || "کاربر AI-Shop"}
                            </h3>
                            {review.user.orders.length > 0 && (
                              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                                <BadgeCheck className="h-3 w-3" />
                                خریدار
                              </span>
                            )}
                          </div>
                          <time className="mt-1 block text-[11px] text-slate-400">
                            {review.createdAt.toLocaleDateString("fa-IR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </time>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1.5 text-sm font-black text-amber-700">
                          {review.rating.toLocaleString("fa-IR")}
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-8 text-slate-600 md:pr-14">
                        {review.content}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
                    <MessageSquareText className="h-8 w-8" />
                  </div>
                  <h3 className="mt-5 font-black text-slate-800">
                    هنوز دیدگاهی ثبت نشده است
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-7 text-slate-500">
                    اولین نفری باشید که تجربه استفاده از این محصول را با دیگران
                    به اشتراک می‌گذارد.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Feature({
  icon,
  title,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
      <div className={color}>{icon}</div>
      <div>
        <p className="text-xs font-black text-slate-700">{title}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

import DigikalaHeader from "@/components/DigikalaHeader";
import ProductCard from "@/components/ProductCard";
import SiteFooter from "@/components/SiteFooter";
import WishlistButton from "@/components/WishlistButton";
import { authOptions } from "@/lib/auth";
import { getAncestors, getCategoryTree } from "@/lib/categories";
import { productCardInclude } from "@/lib/catalog";
import { getDiscountedPrice } from "@/lib/pricing";
import { expireUnpaidOrders } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import {
  BadgeCheck,
  ChevronLeft,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import AddToCartSection from "./addToCartSection";
import ProductGallery from "./ProductGallery";
import ReviewForm from "./ReviewForm";

export const revalidate = 0;

type ProductPageProps = { params: Promise<{ id: string }> };

async function loadProduct(id: string) {
  return prisma.product.findFirst({
    where: { id, isActive: true },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
      reviews: {
        where: { isApproved: true },
        include: {
          user: {
            select: {
              name: true,
              orders: {
                where: {
                  status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
                  items: { some: { productId: id } },
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
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await loadProduct(id);

  if (!product) return {};

  const description = product.description.replace(/\s+/g, " ").slice(0, 160);
  const image = product.imageUrl ?? product.images[0]?.url;

  return {
    title: product.title,
    description,
    alternates: { canonical: `/product/${product.id}` },
    openGraph: {
      title: product.title,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  await expireUnpaidOrders();
  const product = await loadProduct(id);

  if (!product) {
    notFound();
  }

  const { nodes } = await getCategoryTree();
  const categoryNode = nodes.get(product.categoryId);
  const categoryTrail = categoryNode
    ? [...getAncestors(categoryNode, nodes), categoryNode]
    : [product.category];

  const galleryImages = [
    ...(product.imageUrl ? [product.imageUrl] : []),
    ...product.images
      .map((image) => image.url)
      .filter((url) => url !== product.imageUrl),
  ];
  const specs = Array.isArray(product.specs)
    ? (product.specs as { label?: unknown; value?: unknown; key?: unknown }[]).filter(
        (spec): spec is { label: string; value: string; key?: boolean } =>
          typeof spec?.label === "string" && typeof spec?.value === "string",
      )
    : [];

  const session = await getServerSession(authOptions);
  const [wishlistItem, stockNotification] = session?.user?.id
    ? await Promise.all([
        prisma.wishlist.findUnique({
          where: {
            userId_productId: {
              userId: session.user.id,
              productId: product.id,
            },
          },
          select: { id: true },
        }),
        prisma.stockNotification.findUnique({
          where: {
            userId_productId: {
              userId: session.user.id,
              productId: product.id,
            },
          },
          select: { notifiedAt: true },
        }),
      ])
    : [null, null];

  const finalPrice = getDiscountedPrice(product.price, product.discountPercent);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: galleryImages,
    sku: product.id,
    ...(product.brand
      ? { brand: { "@type": "Brand", name: product.brand } }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "IRR",
      price: finalPrice * 10,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

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

  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: product.id },
      categoryId: {
        in: categoryNode
          ? [categoryNode.id, ...categoryNode.children.map((child) => child.id)]
          : [product.categoryId],
      },
    },
    include: productCardInclude,
    orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
    take: 10,
  });

  // مشخصاتی که مدیر با تیک «کلیدی» انتخاب کرده (حداکثر ۴)؛ اگر هیچ‌کدام انتخاب نشده، ۴ مورد اول
  const markedSpecs = specs.filter((spec) => spec.key === true);
  const keySpecs = (markedSpecs.length > 0 ? markedSpecs : specs).slice(0, 4);
  const isAvailable = product.stock > 0;
  const description = product.description.trim();
  const hasLongDescription = description.length > 220;
  const savings = product.price - finalPrice;
  const overview = [
    product.brand
      ? {
          label: "برند",
          value: product.brand,
          href: `/search?q=${encodeURIComponent(product.brand)}`,
        }
      : null,
    {
      label: "دسته‌بندی",
      value: product.category.name,
      href: `/category/${product.category.slug}`,
    },
    { label: "وضعیت", value: isAvailable ? "آماده ارسال" : "ناموجود" },
    product.variants.length > 0
      ? {
          label: "تنوع",
          value: `${product.variants.length.toLocaleString("fa-IR")} گزینه`,
        }
      : null,
  ].filter((item): item is { label: string; value: string; href?: string } =>
    Boolean(item),
  );
  const tabs = [
    hasLongDescription ? { id: "intro", label: "معرفی" } : null,
    specs.length ? { id: "specs", label: "مشخصات" } : null,
    product.aiSummary ? { id: "ai-summary", label: "خلاصه هوشمند" } : null,
    {
      id: "reviews",
      label: `دیدگاه‌ها (${reviewCount.toLocaleString("fa-IR")})`,
    },
  ].filter((tab): tab is { id: string; label: string } => Boolean(tab));

  return (
    <div className="min-h-screen bg-canvas text-slate-800">
      <DigikalaHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <main className="mx-auto max-w-[1400px] px-4 pt-5 pb-28 md:pt-6 lg:pb-10">
        <nav
          aria-label="مسیر صفحه"
          className="mb-4 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-slate-500"
        >
          <Link href="/" className="shrink-0 transition hover:text-brand-600">
            فروشگاه
          </Link>
          {categoryTrail.map((category) => (
            <span
              key={category.id}
              className="flex shrink-0 items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4 text-slate-300" />
              <Link
                href={`/category/${category.slug}`}
                className="transition hover:text-brand-600"
              >
                {category.name}
              </Link>
            </span>
          ))}
        </nav>

        <section className="card rounded-[2rem] p-4 md:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.1fr)_340px] xl:gap-8">
            {/* گالری */}
            <div>
              <ProductGallery images={galleryImages} title={product.title} />
            </div>

            {/* اطلاعات محصول */}
            <div className="min-w-0">
              {product.brand && (
                <Link
                  href={`/search?q=${encodeURIComponent(product.brand)}`}
                  className="text-xs font-bold text-brand-700 hover:underline"
                >
                  {product.brand}
                </Link>
              )}
              <h1 className="mt-1 text-xl leading-9 font-black text-ink md:text-2xl md:leading-10">
                {product.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 pb-4 text-sm">
                <a href="#reviews" className="flex items-center gap-1.5">
                  <span className="flex gap-0.5" dir="ltr">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(averageRating)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-slate-100 text-slate-200"
                        }`}
                      />
                    ))}
                  </span>
                  <span className="font-bold text-slate-700">
                    {reviewCount > 0
                      ? averageRating.toLocaleString("fa-IR", {
                          maximumFractionDigits: 1,
                        })
                      : "بدون امتیاز"}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({reviewCount.toLocaleString("fa-IR")} دیدگاه)
                  </span>
                </a>
                {reviewCount > 0 && (
                  <span className="text-xs text-emerald-700">
                    {recommendationRate.toLocaleString("fa-IR")}٪ خریداران
                    پیشنهاد کرده‌اند
                  </span>
                )}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    isAvailable
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isAvailable ? "موجود" : "ناموجود"}
                </span>
              </div>

              {keySpecs.length > 0 && (
                <div className="pt-4">
                  <h2 className="mb-3 text-sm font-black text-ink">
                    ویژگی‌های کلیدی
                  </h2>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {keySpecs.map((spec, index) => (
                      <li
                        key={index}
                        className="rounded-xl bg-slate-50 px-3 py-2.5"
                      >
                        <span className="block text-[11px] text-slate-400">
                          {spec.label}
                        </span>
                        <span className="line-clamp-1 text-sm font-bold text-slate-700">
                          {spec.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {specs.length > keySpecs.length && (
                    <a
                      href="#specs"
                      className="mt-3 inline-block text-xs font-bold text-brand-700"
                    >
                      مشاهده همه مشخصات
                    </a>
                  )}
                </div>
              )}

              {keySpecs.length === 0 && (
                <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {overview.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-slate-50 px-3 py-2.5"
                    >
                      <dt className="text-[11px] text-slate-400">
                        {item.label}
                      </dt>
                      <dd className="mt-0.5 line-clamp-1 text-sm font-bold text-slate-700">
                        {item.href ? (
                          <Link
                            href={item.href}
                            className="hover:text-brand-700"
                          >
                            {item.value}
                          </Link>
                        ) : (
                          item.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {description && (
                <div className="mt-4">
                  <h2 className="mb-1.5 text-sm font-black text-ink">
                    درباره این کالا
                  </h2>
                  <p
                    className={`text-sm leading-8 whitespace-pre-line text-slate-600 ${hasLongDescription ? "line-clamp-4" : ""}`}
                  >
                    {description}
                  </p>
                  {hasLongDescription && (
                    <a
                      href="#intro"
                      className="mt-1 inline-block text-xs font-bold text-brand-700"
                    >
                      ادامه مطلب
                    </a>
                  )}
                </div>
              )}

              <ul className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
                <li className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                  ضمانت اصالت کالا
                </li>
                <li className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2.5">
                  <Truck className="h-4 w-4 shrink-0 text-brand-600" />
                  ارسال به سراسر کشور
                </li>
              </ul>
            </div>

            {/* باکس خرید */}
            <aside
              id="buy-box"
              className="scroll-mt-32 lg:col-span-2 xl:col-span-1"
            >
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-5 xl:sticky xl:top-32">
                <AddToCartSection
                  productId={product.id}
                  productTitle={product.title}
                  imageUrl={product.imageUrl}
                  price={product.price}
                  discountPercent={product.discountPercent}
                  stock={product.stock}
                  variants={product.variants.map((variant) => ({
                    id: variant.id,
                    name: variant.name,
                    price: variant.price,
                    stock: variant.stock,
                  }))}
                  notifySubscribed={Boolean(
                    stockNotification && !stockNotification.notifiedAt,
                  )}
                />
                {isAvailable &&
                  savings > 0 &&
                  product.variants.length === 0 && (
                    <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                      سود شما از این خرید: {savings.toLocaleString("fa-IR")}{" "}
                      تومان
                    </p>
                  )}
                <WishlistButton
                  productId={product.id}
                  initialWishlisted={Boolean(wishlistItem)}
                />
                <p className="border-t border-slate-200 pt-3 text-[11px] leading-6 text-slate-500">
                  هزینه ارسال بر اساس روش ارسال در مرحله تسویه محاسبه می‌شود.
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* زبانه‌های داخل صفحه (فقط وقتی چند بخش وجود دارد) */}
        {tabs.length >= 3 && (
          <nav
            aria-label="بخش‌های صفحه"
            className="sticky top-[7.75rem] z-30 mt-6 -mx-4 flex gap-1 overflow-x-auto overflow-y-hidden no-scrollbar border-b border-slate-200 bg-canvas/95 px-4 backdrop-blur sm:top-[6.75rem]"
          >
            {tabs.map((tab) => (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                className="shrink-0 border-b-2 border-transparent px-4 py-3 text-sm font-bold text-slate-500 transition hover:border-brand-500 hover:text-ink"
              >
                {tab.label}
              </a>
            ))}
          </nav>
        )}

        {hasLongDescription && (
          <section
            id="intro"
            className="card mt-6 scroll-mt-48 rounded-[2rem] p-5 md:p-8"
          >
            <h2 className="section-title mb-4">معرفی محصول</h2>
            <p className="max-w-4xl text-sm leading-8 whitespace-pre-line text-slate-700">
              {description}
            </p>
          </section>
        )}

        {specs.length > 0 && (
          <section
            id="specs"
            className="card mt-6 scroll-mt-48 rounded-[2rem] p-5 md:p-8"
          >
            <h2 className="section-title mb-5">مشخصات فنی</h2>
            <dl className="max-w-4xl divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100">
              {specs.map((spec, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[minmax(120px,32%)_1fr] text-sm"
                >
                  <dt className="bg-slate-50 px-4 py-3 font-bold text-slate-500">
                    {spec.label}
                  </dt>
                  <dd className="px-4 py-3 leading-7 text-slate-800">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {product.aiSummary && (
          <section
            id="ai-summary"
            className="relative mt-6 scroll-mt-48 overflow-hidden rounded-[2rem] border border-slate-200/70 bg-slate-50 p-6 text-ink md:p-8"
          >
            <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-ai-100/60 blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-3">
                <Sparkles className="h-6 w-6 text-ai-600" />
                <h2 className="text-lg font-black">خلاصه هوشمند دیدگاه‌ها</h2>
                <span className="rounded-full bg-ai-600 px-3 py-1 text-[10px] font-bold text-white">
                  تحلیل AI
                </span>
              </div>
              <p className="mt-4 max-w-5xl text-sm leading-8 text-slate-700">
                {product.aiSummary}
              </p>
            </div>
          </section>
        )}

        <section id="reviews" className="mt-8 scroll-mt-48">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <h2 className="section-title">امتیازها و دیدگاه‌ها</h2>
            {reviewCount > 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {reviewCount.toLocaleString("fa-IR")} دیدگاه
              </span>
            )}
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-4 lg:sticky lg:top-32">
              {reviewCount > 0 && (
                <div className="card rounded-2xl p-5">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-black text-ink">
                      {averageRating.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}
                    </span>
                    <div>
                      <div className="flex gap-0.5" dir="ltr">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(averageRating)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-slate-100 text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        از ۵ · بر اساس {reviewCount.toLocaleString("fa-IR")} دیدگاه
                      </p>
                    </div>
                  </div>
                  {recommendationRate > 0 && (
                    <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                      {recommendationRate.toLocaleString("fa-IR")}٪ خریداران این کالا را پیشنهاد کرده‌اند
                    </p>
                  )}
                  <div className="mt-4 space-y-2">
                    {ratingCounts.map(({ rating, count }) => (
                      <div key={rating} className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="flex w-7 items-center gap-0.5">
                          {rating.toLocaleString("fa-IR")}
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-amber-400"
                            style={{ width: `${Math.round((count / reviewCount) * 100)}%` }}
                          />
                        </div>
                        <span className="w-5 text-left">{count.toLocaleString("fa-IR")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <ReviewForm productId={product.id} />
            </aside>

            <div className="min-w-0">
              {reviewCount > 0 ? (
                <ul className="space-y-3">
                  {product.reviews.map((review) => {
                    const name = review.user.name || "کاربر";
                    return (
                      <li key={review.id} className="rounded-2xl border border-slate-200/70 bg-white p-4 md:p-5">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-black text-brand-700">
                            {name.trim().charAt(0)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-ink">{name}</span>
                              {review.user.orders.length > 0 && (
                                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                  <BadgeCheck className="h-3 w-3" />
                                  خریدار
                                </span>
                              )}
                            </div>
                            <time className="text-[11px] text-slate-400">
                              {review.createdAt.toLocaleDateString("fa-IR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </time>
                          </div>
                          <span className="flex gap-0.5" dir="ltr" aria-label={`${review.rating} از ۵`}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3.5 w-3.5 ${
                                  star <= review.rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"
                                }`}
                              />
                            ))}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-8 text-slate-700">{review.content}</p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600">
                    <MessageSquareText className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-black text-ink">هنوز دیدگاهی برای این کالا ثبت نشده است</h3>
                    <p className="mt-1 text-sm leading-7 text-slate-500">
                      اگر این کالا را خریده‌اید، اولین نفری باشید که تجربه‌تان را به اشتراک می‌گذارد.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
        {related.length > 0 && (
          <section className="mt-10">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="section-title">کالاهای مشابه</h2>
              <Link
                href={`/category/${product.category.slug}`}
                className="text-xs font-bold text-brand-700"
              >
                مشاهده همه
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {related.slice(0, 5).map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* نوار خرید ثابت در موبایل */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgb(15_23_42/0.2)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div>
            {isAvailable ? (
              <>
                {product.discountPercent > 0 && (
                  <span className="block text-[11px] text-slate-400 line-through">
                    {product.price.toLocaleString("fa-IR")}
                  </span>
                )}
                <span className="text-lg font-black text-ink">
                  {finalPrice.toLocaleString("fa-IR")}
                </span>
                <span className="mr-1 text-xs text-slate-500">تومان</span>
              </>
            ) : (
              <span className="font-bold text-slate-400">ناموجود</span>
            )}
          </div>
          <a href="#buy-box" className="btn-primary px-6 py-3">
            {isAvailable
              ? product.variants.length > 0
                ? "انتخاب و خرید"
                : "افزودن به سبد"
              : "خبرم کن"}
          </a>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

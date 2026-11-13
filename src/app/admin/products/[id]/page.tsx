import GenerateSummaryButton from "@/components/admin/GenerateSummaryButton";
import ProductEditor from "@/components/admin/ProductEditor";
import { prisma } from "@/lib/prisma";
import { ArrowRight, BellRing } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEditorOptions } from "../editorData";

export const revalidate = 0;

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const [product, options, waiting] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { sortOrder: "asc" } },
        _count: { select: { reviews: true } },
      },
    }),
    getEditorOptions(),
    prisma.stockNotification.count({ where: { productId: id, notifiedAt: null } }),
  ]);

  if (!product) notFound();

  const specs = Array.isArray(product.specs)
    ? (product.specs as { label?: unknown; value?: unknown; key?: unknown }[])
        .filter((spec) => typeof spec?.label === "string" && typeof spec?.value === "string")
        .map((spec) => ({ label: String(spec.label), value: String(spec.value), key: spec.key === true }))
    : [];

  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-600">
        <ArrowRight className="h-4 w-4" />
        بازگشت به محصولات
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-ink">ویرایش محصول</h1>
        <div className="flex flex-wrap items-center gap-2">
          {waiting > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
              <BellRing className="h-4 w-4" />
              {waiting.toLocaleString("fa-IR")} نفر منتظر موجود شدن
            </span>
          )}
          <GenerateSummaryButton productId={product.id} reviewCount={product._count.reviews} />
        </div>
      </div>
      {created && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
          محصول ساخته شد. اکنون می‌توانید گالری، تنوع‌ها و مشخصات را تکمیل کنید.
        </p>
      )}
      <ProductEditor
        product={{
          id: product.id,
          slug: product.slug,
          discountEndsAt: product.discountEndsAt?.toISOString() ?? null,
          title: product.title,
          description: product.description,
          brand: product.brand,
          categoryId: product.categoryId,
          price: product.price,
          discountPercent: product.discountPercent,
          stock: product.stock,
          isActive: product.isActive,
          imageUrl: product.imageUrl,
          aiSummary: product.aiSummary,
          specs,
          images: product.images.map((image) => ({ id: image.id, url: image.url })),
          variants: product.variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            price: variant.price,
            stock: variant.stock,
          })),
        }}
        {...options}
      />
    </div>
  );
}

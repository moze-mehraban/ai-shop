import {
  createCategoryAction,
  createProductAction,
  deleteCategoryAction,
  deleteProductAction,
  updateProductAction,
} from "@/app/actions/adminActions";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import {
  FolderPlus,
  ImageIcon,
  PackagePlus,
  Pencil,
  Trash2,
} from "lucide-react";
import Image from "next/image";

export const revalidate = 0;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#ef394e] focus:bg-white focus:ring-4 focus:ring-[#ef394e]/10";

export default async function AdminProductsPage() {
  const { prisma } = await import("@/lib/prisma");
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
        _count: {
          select: { reviews: true, orderItems: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-bold text-[#ef394e]">کاتالوگ فروشگاه</p>
        <h1 className="mt-1 text-3xl font-black text-slate-900">
          محصولات و دسته‌ها
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          قیمت، موجودی، تصاویر و محتوای هوشمند کالاها را مدیریت کنید.
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-rose-50 p-3 text-[#ef394e]">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-slate-900">افزودن محصول جدید</h2>
              <p className="mt-1 text-[11px] text-slate-400">
                همه فیلدهای اصلی را قبل از ذخیره بررسی کنید.
              </p>
            </div>
          </div>

          <form action={createProductAction} className="grid gap-4 md:grid-cols-2">
            <Field label="عنوان محصول" name="title" required className="md:col-span-2" />
            <Field label="قیمت (تومان)" name="price" type="number" min="0" required />
            <Field label="درصد تخفیف" name="discountPercent" type="number" min="0" max="90" defaultValue={0} required />
            <Field label="موجودی" name="stock" type="number" min="0" required />
            <label className="space-y-1.5 text-xs font-bold text-slate-600">
              دسته‌بندی
              <select name="categoryId" required className={inputClass} defaultValue="">
                <option value="" disabled>
                  انتخاب دسته‌بندی
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="آدرس تصویر"
              name="imageUrl"
              type="url"
              placeholder="https://images.unsplash.com/..."
            />
            <label className="space-y-1.5 text-xs font-bold text-slate-600 md:col-span-2">
              توضیحات
              <textarea
                name="description"
                required
                rows={3}
                className={inputClass}
                placeholder="توضیح کوتاه و دقیق درباره محصول"
              />
            </label>
            <AdminSubmitButton
              className="rounded-xl bg-[#ef394e] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#d82a3d] md:col-span-2"
              pendingLabel="در حال افزودن..."
            >
              افزودن محصول
            </AdminSubmitButton>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-purple-50 p-3 text-purple-600">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-slate-900">دسته‌بندی‌ها</h2>
              <p className="mt-1 text-[11px] text-slate-400">
                دسته خالی را می‌توانید حذف کنید.
              </p>
            </div>
          </div>

          <form action={createCategoryAction} className="space-y-3">
            <input name="name" required placeholder="نام دسته جدید" className={inputClass} />
            <input name="slug" placeholder="slug اختیاری" className={inputClass} />
            <AdminSubmitButton
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white transition hover:bg-slate-800"
              pendingLabel="در حال ساخت..."
            >
              ساخت دسته‌بندی
            </AdminSubmitButton>
          </form>

          <div className="mt-5 space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
              >
                <span className="flex-1 text-xs font-bold text-slate-700">
                  {category.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  {category._count.products.toLocaleString("fa-IR")} کالا
                </span>
                {category._count.products === 0 && (
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <button
                      type="submit"
                      aria-label={`حذف ${category.name}`}
                      className="text-slate-400 transition hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-black text-slate-900">فهرست محصولات</h2>
            <p className="mt-1 text-xs text-slate-400">
              {products.length.toLocaleString("fa-IR")} محصول در کاتالوگ
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {products.map((product) => (
            <details
              key={product.id}
              className="group rounded-2xl border border-slate-100 bg-slate-50 open:bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center gap-4 p-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      unoptimized
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <ImageIcon className="m-4 h-6 w-6 text-slate-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-black text-slate-800">
                    {product.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {product.category.name} •{" "}
                    {product._count.reviews.toLocaleString("fa-IR")} دیدگاه
                  </p>
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-black text-slate-900">
                    {product.price.toLocaleString("fa-IR")}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    تومان
                    {product.discountPercent > 0 &&
                      ` • ${product.discountPercent.toLocaleString("fa-IR")}٪ تخفیف`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-black ${
                    product.stock <= 5
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  موجودی {product.stock.toLocaleString("fa-IR")}
                </span>
                <Pencil className="h-4 w-4 text-slate-300 transition group-open:text-[#ef394e]" />
              </summary>

              <div className="border-t border-slate-100 p-4">
                <form action={updateProductAction} className="grid gap-4 md:grid-cols-2">
                  <input type="hidden" name="productId" value={product.id} />
                  <Field label="عنوان محصول" name="title" defaultValue={product.title} required className="md:col-span-2" />
                  <Field label="قیمت (تومان)" name="price" type="number" min="0" defaultValue={product.price} required />
                  <Field label="درصد تخفیف" name="discountPercent" type="number" min="0" max="90" defaultValue={product.discountPercent} required />
                  <Field label="موجودی" name="stock" type="number" min="0" defaultValue={product.stock} required />
                  <label className="space-y-1.5 text-xs font-bold text-slate-600">
                    دسته‌بندی
                    <select name="categoryId" defaultValue={product.categoryId} className={inputClass}>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field label="آدرس تصویر" name="imageUrl" type="url" defaultValue={product.imageUrl || ""} />
                  <label className="space-y-1.5 text-xs font-bold text-slate-600 md:col-span-2">
                    توضیحات
                    <textarea name="description" required rows={3} defaultValue={product.description} className={inputClass} />
                  </label>
                  <label className="space-y-1.5 text-xs font-bold text-slate-600 md:col-span-2">
                    خلاصه هوشمند
                    <textarea name="aiSummary" rows={2} defaultValue={product.aiSummary || ""} className={inputClass} placeholder="خلاصه‌ای که در صفحه محصول نمایش داده می‌شود" />
                  </label>
                  <AdminSubmitButton
                    className="rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white transition hover:bg-slate-800"
                    pendingLabel="در حال ذخیره..."
                  >
                    ذخیره تغییرات
                  </AdminSubmitButton>
                </form>
                {product._count.orderItems === 0 && (
                  <form action={deleteProductAction} className="mt-3">
                    <input type="hidden" name="productId" value={product.id} />
                    <AdminSubmitButton
                      className="rounded-xl border border-rose-200 px-5 py-3 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                      pendingLabel="در حال حذف..."
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف محصول
                    </AdminSubmitButton>
                  </form>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  className = "",
  ...props
}: {
  label: string;
  name: string;
  className?: string;
  type?: string;
  min?: string;
  max?: string;
  required?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
}) {
  return (
    <label className={`space-y-1.5 text-xs font-bold text-slate-600 ${className}`}>
      {label}
      <input name={name} className={inputClass} {...props} />
    </label>
  );
}

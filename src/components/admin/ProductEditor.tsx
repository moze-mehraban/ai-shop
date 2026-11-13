"use client";

/* eslint-disable @next/next/no-img-element */
import { deleteProductAction, saveProductAction } from "@/app/actions/adminCatalogActions";
import ActionForm from "@/components/admin/ActionForm";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

type Spec = { label: string; value: string; key?: boolean };

// حداکثر تعداد مشخصاتی که می‌توان «کلیدی» انتخاب کرد
const MAX_KEY_SPECS = 4;
type Variant = { id?: string; name: string; price: string; stock: string };

export type EditableProduct = {
  id: string;
  title: string;
  description: string;
  brand: string | null;
  categoryId: string;
  price: number;
  discountPercent: number;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
  aiSummary: string | null;
  specs: Spec[];
  images: { id: string; url: string }[];
  variants: { id: string; name: string; price: number | null; stock: number }[];
};

const label = "mb-1.5 block text-xs font-bold text-slate-600";

export default function ProductEditor({
  product,
  categories,
  brands,
}: {
  product?: EditableProduct;
  categories: { id: string; label: string }[];
  brands: string[];
}) {
  const [specs, setSpecs] = useState<Spec[]>(product?.specs.length ? product.specs : []);
  const [variants, setVariants] = useState<Variant[]>(
    product?.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      price: variant.price === null ? "" : String(variant.price),
      stock: String(variant.stock),
    })) ?? [],
  );
  const [removed, setRemoved] = useState<string[]>([]);
  const [coverPreview, setCoverPreview] = useState<string | null>(product?.imageUrl ?? null);
  const [galleryPreview, setGalleryPreview] = useState<string[]>([]);

  // بعد از ذخیره، داده‌های تازه سرور (شناسه تنوع‌های جدید و تصاویر) جایگزین وضعیت فرم می‌شود
  const serverKey = JSON.stringify([product?.variants, product?.images, product?.imageUrl]);
  const [syncedKey, setSyncedKey] = useState(serverKey);
  if (product && serverKey !== syncedKey) {
    setSyncedKey(serverKey);
    setVariants(
      product.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        price: variant.price === null ? "" : String(variant.price),
        stock: String(variant.stock),
      })),
    );
    setRemoved([]);
    setGalleryPreview([]);
    setCoverPreview(product.imageUrl);
  }

  const keyCount = specs.filter((spec) => spec.key).length;
  const variantStock = variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0);

  return (
    <div className="space-y-6">
      <ActionForm action={saveProductAction} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {product && <input type="hidden" name="id" value={product.id} />}
        <input type="hidden" name="specs" value={JSON.stringify(specs)} />
        <input
          type="hidden"
          name="variants"
          value={JSON.stringify(
            variants.map((variant) => ({
              id: variant.id,
              name: variant.name,
              price: variant.price.trim() === "" ? null : Number(variant.price),
              stock: Number(variant.stock) || 0,
            })),
          )}
        />
        {removed.map((id) => (
          <input key={id} type="hidden" name="removeImageIds" value={id} />
        ))}

        <div className="space-y-6">
          {/* اطلاعات اصلی */}
          <section className="card space-y-4 rounded-2xl p-5">
            <h2 className="font-black text-ink">اطلاعات اصلی</h2>
            <div>
              <label className={label} htmlFor="title">عنوان محصول</label>
              <input id="title" name="title" required defaultValue={product?.title} className="field" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="categoryId">دسته‌بندی</label>
                <select id="categoryId" name="categoryId" required defaultValue={product?.categoryId ?? ""} className="field">
                  <option value="" disabled>انتخاب دسته</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="brand">برند</label>
                <input id="brand" name="brand" list="brand-list" defaultValue={product?.brand ?? ""} className="field" />
                <datalist id="brand-list">
                  {brands.map((brand) => <option key={brand} value={brand} />)}
                </datalist>
              </div>
            </div>
            <div>
              <label className={label} htmlFor="description">توضیحات</label>
              <textarea id="description" name="description" required rows={6} defaultValue={product?.description} className="field leading-7" />
            </div>
          </section>

          {/* قیمت و موجودی */}
          <section className="card grid gap-4 rounded-2xl p-5 sm:grid-cols-3">
            <h2 className="font-black text-ink sm:col-span-3">قیمت و موجودی</h2>
            <div>
              <label className={label} htmlFor="price">قیمت (تومان)</label>
              <input id="price" name="price" required inputMode="numeric" defaultValue={product?.price} className="field" />
            </div>
            <div>
              <label className={label} htmlFor="discountPercent">درصد تخفیف</label>
              <input id="discountPercent" name="discountPercent" inputMode="numeric" defaultValue={product?.discountPercent ?? 0} className="field" />
            </div>
            <div>
              <label className={label} htmlFor="stock">موجودی</label>
              {variants.length > 0 ? (
                <p className="field bg-slate-100 text-slate-500">
                  {variantStock.toLocaleString("fa-IR")} (جمع تنوع‌ها)
                </p>
              ) : (
                <input id="stock" name="stock" inputMode="numeric" defaultValue={product?.stock ?? 0} className="field" />
              )}
            </div>
          </section>

          {/* تنوع‌ها */}
          <section className="card space-y-3 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-black text-ink">تنوع‌ها (رنگ، سایز، حافظه ...)</h2>
                <p className="mt-1 text-xs text-slate-500">اگر قیمت تنوع خالی باشد، قیمت اصلی محصول استفاده می‌شود.</p>
              </div>
              <button
                type="button"
                onClick={() => setVariants([...variants, { name: "", price: "", stock: "0" }])}
                className="btn-ghost px-3 py-2 text-xs"
              >
                <Plus className="h-4 w-4" />
                افزودن تنوع
              </button>
            </div>
            {variants.map((variant, index) => (
              <div key={variant.id ?? `new-${index}`} className="grid grid-cols-[1fr_120px_90px_auto] gap-2">
                <input
                  aria-label="نام تنوع"
                  placeholder="مثلاً مشکی - ۱۲۸ گیگ"
                  value={variant.name}
                  onChange={(event) => setVariants(variants.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)))}
                  className="field py-2"
                />
                <input
                  aria-label="قیمت تنوع"
                  placeholder="قیمت"
                  inputMode="numeric"
                  value={variant.price}
                  onChange={(event) => setVariants(variants.map((item, i) => (i === index ? { ...item, price: event.target.value } : item)))}
                  className="field py-2"
                />
                <input
                  aria-label="موجودی تنوع"
                  placeholder="موجودی"
                  inputMode="numeric"
                  value={variant.stock}
                  onChange={(event) => setVariants(variants.map((item, i) => (i === index ? { ...item, stock: event.target.value } : item)))}
                  className="field py-2"
                />
                <button type="button" aria-label="حذف تنوع" onClick={() => setVariants(variants.filter((_, i) => i !== index))} className="rounded-xl px-2 text-rose-500 hover:bg-rose-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </section>

          {/* مشخصات فنی */}
          <section className="card space-y-3 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-black text-ink">مشخصات فنی</h2>
                <p className="mt-1 text-xs text-slate-500">
                  با تیک «کلیدی» (حداکثر ۴ مورد)، آن مشخصه در کادر «ویژگی‌های کلیدی» بالای صفحه محصول نمایش داده می‌شود.
                </p>
              </div>
              <button type="button" onClick={() => setSpecs([...specs, { label: "", value: "" }])} className="btn-ghost px-3 py-2 text-xs">
                <Plus className="h-4 w-4" />
                افزودن ردیف
              </button>
            </div>
            {specs.map((spec, index) => (
              <div key={index} className="grid grid-cols-[180px_1fr_auto_auto] items-center gap-2">
                <input
                  aria-label="عنوان مشخصه"
                  placeholder="مثلاً حافظه داخلی"
                  value={spec.label}
                  onChange={(event) => setSpecs(specs.map((item, i) => (i === index ? { ...item, label: event.target.value } : item)))}
                  className="field py-2"
                />
                <input
                  aria-label="مقدار مشخصه"
                  placeholder="مثلاً ۱۲۸ گیگابایت"
                  value={spec.value}
                  onChange={(event) => setSpecs(specs.map((item, i) => (i === index ? { ...item, value: event.target.value } : item)))}
                  className="field py-2"
                />
                <label
                  title={!spec.key && keyCount >= MAX_KEY_SPECS ? `حداکثر ${MAX_KEY_SPECS} مشخصه کلیدی` : undefined}
                  className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-bold whitespace-nowrap transition ${
                    spec.key
                      ? "cursor-pointer border-brand-300 bg-brand-50 text-brand-800"
                      : keyCount >= MAX_KEY_SPECS
                        ? "cursor-not-allowed border-slate-100 text-slate-300"
                        : "cursor-pointer border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={!spec.key && keyCount >= MAX_KEY_SPECS}
                    checked={Boolean(spec.key)}
                    onChange={(event) => setSpecs(specs.map((item, i) => (i === index ? { ...item, key: event.target.checked } : item)))}
                    className="h-4 w-4 accent-brand-500"
                  />
                  کلیدی
                </label>
                <button type="button" aria-label="حذف ردیف" onClick={() => setSpecs(specs.filter((_, i) => i !== index))} className="rounded-xl px-2 text-rose-500 hover:bg-rose-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {specs.length === 0 && <p className="text-xs text-slate-400">مشخصه‌ای ثبت نشده است.</p>}
            {specs.length > 0 && (
              <p className="text-[11px] text-slate-400">
                {keyCount > 0
                  ? `${keyCount.toLocaleString("fa-IR")} از ${MAX_KEY_SPECS.toLocaleString("fa-IR")} مشخصه کلیدی انتخاب شده است.${
                      keyCount >= MAX_KEY_SPECS ? " برای انتخاب مورد دیگر، تیک یکی را بردارید." : ""
                    }`
                  : `هیچ مشخصه‌ای کلیدی انتخاب نشده؛ در این حالت ${MAX_KEY_SPECS.toLocaleString("fa-IR")} مشخصه اول نمایش داده می‌شود.`}
              </p>
            )}
          </section>

          {product && (
            <section className="card space-y-3 rounded-2xl p-5">
              <h2 className="font-black text-ink">خلاصه هوشمند دیدگاه‌ها</h2>
              <textarea name="aiSummary" rows={4} defaultValue={product.aiSummary ?? ""} className="field leading-7" />
            </section>
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6">
          <section className="card space-y-4 rounded-2xl p-5">
            <label className="flex items-center justify-between text-sm font-bold text-slate-700">
              نمایش در فروشگاه
              <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} className="h-5 w-5 accent-brand-500" />
            </label>
            <AdminSubmitButton className="btn-primary w-full">
              {product ? "ذخیره تغییرات" : "ایجاد محصول"}
            </AdminSubmitButton>
            {product && (
              <a href={`/product/${product.id}`} target="_blank" className="btn-ghost w-full py-2.5 text-xs">
                مشاهده در فروشگاه
              </a>
            )}
          </section>

          <section className="card space-y-3 rounded-2xl p-5">
            <h2 className="font-black text-ink">تصویر اصلی</h2>
            <div className="aspect-square overflow-hidden rounded-xl bg-slate-50">
              {coverPreview && <img src={coverPreview} alt="" className="h-full w-full object-contain p-2" />}
            </div>
            <label className="btn-ghost w-full cursor-pointer py-2.5 text-xs">
              <ImagePlus className="h-4 w-4" />
              آپلود تصویر
              <input
                type="file"
                name="coverFile"
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setCoverPreview(URL.createObjectURL(file));
                }}
              />
            </label>
            <input name="imageUrl" defaultValue={product?.imageUrl ?? ""} placeholder="یا آدرس اینترنتی تصویر" dir="ltr" className="field py-2 text-xs" />
          </section>

          <section className="card space-y-3 rounded-2xl p-5">
            <h2 className="font-black text-ink">گالری تصاویر</h2>
            <div className="grid grid-cols-3 gap-2">
              {product?.images
                .filter((image) => !removed.includes(image.id))
                .map((image) => (
                  <div key={image.id} className="relative aspect-square overflow-hidden rounded-xl bg-slate-50">
                    <img src={image.url} alt="" className="h-full w-full object-contain p-1" />
                    <button
                      type="button"
                      aria-label="حذف تصویر"
                      onClick={() => setRemoved([...removed, image.id])}
                      className="absolute top-1 left-1 rounded-full bg-white/90 p-1 text-brand-600 shadow"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              {galleryPreview.map((url) => (
                <div key={url} className="aspect-square overflow-hidden rounded-xl border-2 border-dashed border-brand-200 bg-slate-50">
                  <img src={url} alt="" className="h-full w-full object-contain p-1" />
                </div>
              ))}
            </div>
            <label className="btn-ghost w-full cursor-pointer py-2.5 text-xs">
              <ImagePlus className="h-4 w-4" />
              افزودن تصاویر (حداکثر ۱۰)
              <input
                type="file"
                name="galleryFiles"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                className="sr-only"
                onChange={(event) =>
                  setGalleryPreview([...(event.target.files ?? [])].map((file) => URL.createObjectURL(file)))
                }
              />
            </label>
            <p className="text-[11px] text-slate-400">هر تصویر حداکثر ۵ مگابایت (JPG, PNG, WEBP)</p>
          </section>
        </aside>
      </ActionForm>

      {product && (
        <ActionForm
          action={deleteProductAction}
          confirmMessage="این محصول برای همیشه حذف شود؟"
          className="card flex flex-wrap items-center justify-between gap-3 rounded-2xl border-rose-100 p-5"
        >
          <input type="hidden" name="id" value={product.id} />
          <div>
            <p className="font-black text-ink">حذف محصول</p>
            <p className="text-xs text-slate-500">محصولی که سفارش داشته قابل حذف نیست؛ آن را غیرفعال کنید.</p>
          </div>
          <AdminSubmitButton className="btn border border-rose-200 bg-white px-4 py-2 text-rose-600 hover:bg-rose-50" pendingLabel="در حال حذف...">
            <Trash2 className="h-4 w-4" />
            حذف
          </AdminSubmitButton>
        </ActionForm>
      )}
    </div>
  );
}

"use server";

import { requireAdmin } from "@/lib/admin";
import { normalizeDigits, normalizeMobile } from "@/lib/digits";
import { prisma } from "@/lib/prisma";
import { SETTING_FIELDS, type SettingKey } from "@/lib/settings";
import { sendSmsIrTemplate } from "@/lib/smsir";
import { saveUploadedImage } from "@/lib/uploads";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type FormState = { ok: boolean; message: string };

const ok = (message: string): FormState => ({ ok: true, message });
const fail = (message: string): FormState => ({ ok: false, message });

function text(formData: FormData, field: string, max = 5000) {
  return String(formData.get(field) ?? "").trim().slice(0, max);
}

function num(formData: FormData, field: string) {
  const raw = normalizeDigits(text(formData, field, 40)).replace(/[,٬\s]/g, "");
  return raw === "" ? null : Number(raw);
}

function slugify(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function isUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function revalidateStore() {
  revalidatePath("/", "layout");
}

/* ------------------------------------------------------------------ */
/* دسته‌بندی‌ها                                                        */
/* ------------------------------------------------------------------ */

export async function saveCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("/admin/categories");

  const id = text(formData, "id", 50) || null;
  const name = text(formData, "name", 80);
  const slug = slugify(text(formData, "slug", 100) || name);
  const parentId = text(formData, "parentId", 50) || null;
  const description = text(formData, "description", 1000) || null;
  const sortOrder = Math.trunc(num(formData, "sortOrder") ?? 0);

  if (name.length < 2 || !slug) return fail("نام دسته حداقل ۲ حرف باشد.");

  if (id && parentId) {
    // جلوگیری از حلقه: والد نباید خود دسته یا یکی از زیرمجموعه‌هایش باشد
    const all = await prisma.category.findMany({ select: { id: true, parentId: true } });
    let cursor: string | null = parentId;
    const seen = new Set<string>();
    while (cursor && !seen.has(cursor)) {
      if (cursor === id) return fail("دسته نمی‌تواند زیرمجموعه خودش یا زیرمجموعه‌هایش باشد.");
      seen.add(cursor);
      cursor = all.find((category) => category.id === cursor)?.parentId ?? null;
    }
  }

  try {
    const data = { name, slug, parentId, description, sortOrder };
    if (id) {
      await prisma.category.update({ where: { id }, data });
    } else {
      await prisma.category.create({ data });
    }
  } catch (error) {
    if (isUniqueError(error)) return fail("این نامک (slug) قبلاً استفاده شده است.");
    throw error;
  }

  revalidateStore();
  return ok(id ? "دسته‌بندی ویرایش شد." : "دسته‌بندی جدید ساخته شد.");
}

export async function deleteCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("/admin/categories");
  const id = text(formData, "id", 50);

  const [products, children] = await Promise.all([
    prisma.product.count({ where: { categoryId: id } }),
    prisma.category.count({ where: { parentId: id } }),
  ]);

  if (products > 0) return fail(`این دسته ${products.toLocaleString("fa-IR")} محصول دارد؛ ابتدا محصولات را جابه‌جا کنید.`);
  if (children > 0) return fail("این دسته زیرمجموعه دارد؛ ابتدا زیرمجموعه‌ها را حذف یا جابه‌جا کنید.");

  await prisma.category.delete({ where: { id } });
  revalidateStore();
  return ok("دسته‌بندی حذف شد.");
}

/* ------------------------------------------------------------------ */
/* محصولات                                                             */
/* ------------------------------------------------------------------ */

type VariantInput = { id?: string; name: string; price: number | null; stock: number };
type SpecInput = { label: string; value: string; key?: boolean };

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function notifyRestock(productId: string, title: string) {
  const subscribers = await prisma.stockNotification.findMany({
    where: { productId, notifiedAt: null },
    include: { user: { select: { mobile: true } } },
    take: 500,
  });
  if (subscribers.length === 0) return 0;

  await Promise.all(
    subscribers.map((subscriber) =>
      subscriber.user.mobile
        ? sendSmsIrTemplate({
            mobile: subscriber.user.mobile,
            templateEnv: "SMSIR_RESTOCK_TEMPLATE_ID",
            parameters: { PRODUCT: title.slice(0, 40) },
          })
        : Promise.resolve(false),
    ),
  );
  await prisma.stockNotification.updateMany({
    where: { id: { in: subscribers.map((subscriber) => subscriber.id) } },
    data: { notifiedAt: new Date() },
  });
  return subscribers.length;
}

export async function saveProductAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("/admin/products");

  const id = text(formData, "id", 50) || null;
  const title = text(formData, "title", 200);
  const description = text(formData, "description", 20000);
  const brand = text(formData, "brand", 80) || null;
  const categoryId = text(formData, "categoryId", 50);
  const aiSummary = text(formData, "aiSummary", 5000) || null;
  const price = num(formData, "price");
  const discountPercent = Math.trunc(num(formData, "discountPercent") ?? 0);
  let stock = Math.trunc(num(formData, "stock") ?? 0);
  const isActive = formData.get("isActive") === "on";
  let imageUrl = text(formData, "imageUrl", 1000) || null;

  let keyCount = 0;
  const specs = parseJson<SpecInput[]>(text(formData, "specs", 50000), [])
    .map((spec) => ({
      label: String(spec.label ?? "").trim().slice(0, 80),
      value: String(spec.value ?? "").trim().slice(0, 500),
      key: spec.key === true,
    }))
    .filter((spec) => spec.label && spec.value)
    .slice(0, 60)
    // حداکثر ۴ مشخصه کلیدی؛ تیک‌های اضافه نادیده گرفته می‌شوند
    .map(({ key, ...spec }) => (key && keyCount < 4 ? (keyCount++, { ...spec, key: true }) : spec));

  const variants = parseJson<VariantInput[]>(text(formData, "variants", 50000), [])
    .map((variant) => ({
      id: typeof variant.id === "string" && variant.id ? variant.id : undefined,
      name: String(variant.name ?? "").trim().slice(0, 80),
      price: variant.price === null || variant.price === undefined || String(variant.price) === "" ? null : Number(variant.price),
      stock: Math.trunc(Number(variant.stock) || 0),
    }))
    .filter((variant) => variant.name)
    .slice(0, 50);

  if (title.length < 2) return fail("عنوان محصول را وارد کنید.");
  if (description.length < 3) return fail("توضیحات محصول را وارد کنید.");
  if (!categoryId) return fail("دسته‌بندی را انتخاب کنید.");
  if (price === null || !Number.isFinite(price) || price < 0) return fail("قیمت معتبر نیست.");
  if (discountPercent < 0 || discountPercent > 90) return fail("درصد تخفیف باید بین ۰ تا ۹۰ باشد.");
  if (variants.some((variant) => variant.stock < 0 || (variant.price !== null && (!Number.isFinite(variant.price) || variant.price < 0)))) {
    return fail("قیمت یا موجودی یکی از تنوع‌ها معتبر نیست.");
  }
  if (variants.length > 0) {
    stock = variants.reduce((sum, variant) => sum + variant.stock, 0);
  }
  if (stock < 0) return fail("موجودی نمی‌تواند منفی باشد.");

  // آپلود تصاویر
  let uploadedGallery: string[] = [];
  try {
    const cover = formData.get("coverFile");
    if (cover instanceof File && cover.size > 0) {
      imageUrl = await saveUploadedImage(cover);
    }
    const galleryFiles = formData.getAll("galleryFiles").filter((file): file is File => file instanceof File && file.size > 0);
    uploadedGallery = await Promise.all(galleryFiles.slice(0, 10).map(saveUploadedImage));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "آپلود تصویر انجام نشد.");
  }
  const removeImageIds = formData.getAll("removeImageIds").map(String);

  const previous = id
    ? await prisma.product.findUnique({
        where: { id },
        select: { stock: true, variants: { select: { id: true, stock: true } } },
      })
    : null;
  if (id && !previous) return fail("محصول پیدا نشد.");

  const data = {
    title,
    description,
    brand,
    imageUrl,
    aiSummary,
    price,
    discountPercent,
    stock,
    isActive,
    specs: specs.length ? (specs as Prisma.InputJsonValue) : Prisma.DbNull,
    category: { connect: { id: categoryId } },
  };

  const productId = await prisma.$transaction(async (tx) => {
    const product = id
      ? await tx.product.update({ where: { id }, data })
      : await tx.product.create({ data });

    // همگام‌سازی تنوع‌ها
    const keepIds = variants.map((variant) => variant.id).filter((value): value is string => Boolean(value));
    await tx.productVariant.deleteMany({
      where: { productId: product.id, ...(keepIds.length ? { id: { notIn: keepIds } } : {}) },
    });
    for (const [index, variant] of variants.entries()) {
      const variantData = { name: variant.name, price: variant.price, stock: variant.stock, sortOrder: index };
      if (variant.id) {
        await tx.productVariant.updateMany({ where: { id: variant.id, productId: product.id }, data: variantData });
      } else {
        await tx.productVariant.create({ data: { ...variantData, productId: product.id } });
      }
    }

    if (removeImageIds.length) {
      await tx.productImage.deleteMany({ where: { productId: product.id, id: { in: removeImageIds } } });
    }
    if (uploadedGallery.length) {
      const last = await tx.productImage.aggregate({ where: { productId: product.id }, _max: { sortOrder: true } });
      await tx.productImage.createMany({
        data: uploadedGallery.map((url, index) => ({
          productId: product.id,
          url,
          sortOrder: (last._max.sortOrder ?? 0) + index + 1,
        })),
      });
    }
    return product.id;
  });

  let notified = 0;
  const variantRestocked = Boolean(
    previous?.variants.some(
      (old) => old.stock <= 0 && variants.some((variant) => variant.id === old.id && variant.stock > 0),
    ),
  );
  if (previous && isActive && stock > 0 && (previous.stock <= 0 || variantRestocked)) {
    notified = await notifyRestock(productId, title);
  }

  revalidateStore();

  if (!id) {
    redirect(`/admin/products/${productId}?created=1`);
  }

  return ok(
    notified > 0
      ? `محصول ذخیره شد و به ${notified.toLocaleString("fa-IR")} نفر موجود شدن کالا اطلاع داده شد.`
      : "تغییرات محصول ذخیره شد.",
  );
}

export async function deleteProductAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("/admin/products");
  const id = text(formData, "id", 50);

  const orderItems = await prisma.orderItem.count({ where: { productId: id } });
  if (orderItems > 0) {
    return fail("این محصول در سفارش‌ها استفاده شده و قابل حذف نیست؛ به‌جای حذف، آن را غیرفعال کنید.");
  }

  await prisma.product.delete({ where: { id } });
  revalidateStore();
  redirect("/admin/products");
}

/* ------------------------------------------------------------------ */
/* کد تخفیف                                                            */
/* ------------------------------------------------------------------ */

export async function saveCouponAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("/admin/coupons");

  const code = text(formData, "code", 40).toUpperCase().replace(/\s+/g, "");
  const type = text(formData, "type") === "FIXED" ? "FIXED" : "PERCENT";
  const value = num(formData, "value");
  const maxDiscount = num(formData, "maxDiscount");
  const minOrder = num(formData, "minOrder") ?? 0;
  const maxUses = num(formData, "maxUses");
  const days = num(formData, "days");

  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return fail("کد باید ۳ تا ۴۰ حرف انگلیسی یا عدد باشد.");
  if (value === null || !(value > 0) || (type === "PERCENT" && value > 100)) return fail("مقدار تخفیف معتبر نیست.");

  try {
    await prisma.coupon.create({
      data: {
        code,
        type,
        value,
        maxDiscount: type === "PERCENT" && maxDiscount ? maxDiscount : null,
        minOrder: Math.max(0, minOrder),
        maxUses: maxUses && maxUses > 0 ? Math.trunc(maxUses) : null,
        expiresAt: days && days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null,
      },
    });
  } catch (error) {
    if (isUniqueError(error)) return fail("این کد تخفیف قبلاً ساخته شده است.");
    throw error;
  }

  revalidatePath("/admin/coupons");
  return ok(`کد ${code} ساخته شد.`);
}

export async function toggleCouponAction(formData: FormData) {
  await requireAdmin("/admin/coupons");
  const id = text(formData, "id", 50);
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (coupon) await prisma.coupon.update({ where: { id }, data: { isActive: !coupon.isActive } });
  revalidatePath("/admin/coupons");
}

export async function deleteCouponAction(formData: FormData) {
  await requireAdmin("/admin/coupons");
  await prisma.coupon.deleteMany({ where: { id: text(formData, "id", 50) } });
  revalidatePath("/admin/coupons");
}

/* ------------------------------------------------------------------ */
/* روش‌های ارسال و تنظیمات                                              */
/* ------------------------------------------------------------------ */

export async function saveShippingMethodAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("/admin/settings");

  const id = text(formData, "id", 50) || null;
  const name = text(formData, "name", 80);
  const description = text(formData, "description", 200) || null;
  const cost = num(formData, "cost") ?? 0;
  const freeOver = num(formData, "freeOver");
  const sortOrder = Math.trunc(num(formData, "sortOrder") ?? 0);
  const isActive = formData.get("isActive") === "on";

  if (name.length < 2) return fail("نام روش ارسال را وارد کنید.");
  if (cost < 0 || (freeOver !== null && freeOver < 0)) return fail("مبلغ‌ها نمی‌توانند منفی باشند.");

  const data = { name, description, cost, freeOver: freeOver || null, sortOrder, isActive };
  if (id) {
    await prisma.shippingMethod.update({ where: { id }, data });
  } else {
    await prisma.shippingMethod.create({ data });
  }

  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  return ok("روش ارسال ذخیره شد.");
}

export async function deleteShippingMethodAction(formData: FormData) {
  await requireAdmin("/admin/settings");
  await prisma.shippingMethod.deleteMany({ where: { id: text(formData, "id", 50) } });
  revalidatePath("/admin/settings");
}

export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("/admin/settings");

  const keys = Object.keys(SETTING_FIELDS) as SettingKey[];
  const values = keys.map((key) => {
    let value = text(formData, key, 30000);
    if (key === "adminMobile" && value) value = normalizeMobile(value);
    return { key, value };
  });

  await prisma.$transaction(
    values.map(({ key, value }) =>
      prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } }),
    ),
  );

  revalidateStore();
  return ok("تنظیمات فروشگاه ذخیره شد.");
}

// ساخت آدرس خوانا از عنوان (فارسی و انگلیسی): «گوشی موبایل سامسونگ Galaxy A55» ← «گوشی-موبایل-سامسونگ-galaxy-a55»
export function makeSlug(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .toLowerCase()
    .replace(/[‌‏]/g, "-")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .replace(/-$/, "");
}

// اگر آدرس تکراری بود، شماره به انتهایش اضافه می‌شود (…-2، …-3)
export async function uniqueSlug(base: string, isTaken: (slug: string) => Promise<boolean>) {
  const root = base || "product";
  let candidate = root;
  for (let index = 2; await isTaken(candidate); index++) {
    candidate = `${root}-${index}`;
  }
  return candidate;
}

// لینک صفحه محصول (آدرس خوانا اگر داشته باشد)
export function productHref(product: { id: string; slug?: string | null }) {
  return `/product/${product.slug || product.id}`;
}

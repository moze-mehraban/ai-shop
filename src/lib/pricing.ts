export function normalizeDiscountPercent(discountPercent: number) {
  if (!Number.isFinite(discountPercent)) {
    return 0;
  }

  return Math.max(0, Math.min(90, Math.round(discountPercent)));
}

export function getDiscountedPrice(
  price: number,
  discountPercent: number,
) {
  const normalizedDiscount = normalizeDiscountPercent(discountPercent);
  return Math.round(price * (1 - normalizedDiscount / 100));
}

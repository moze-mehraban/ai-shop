"use client";

import { checkCouponAction, createOrderAction } from "@/app/actions/orderActions";
import AddressForm from "@/components/AddressForm";
import { useCart } from "@/components/CartProvider";
import { getShippingCost, type ShippingMethodInfo } from "@/lib/checkout";
import { CheckCircle2, Loader2, MapPin, Plus, TicketPercent, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Address = {
  id: string;
  title: string | null;
  recipientName: string;
  mobile: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  isDefault: boolean;
};

export default function CheckoutClient({
  addresses,
  shippingMethods,
}: {
  addresses: Address[];
  shippingMethods: ShippingMethodInfo[];
}) {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "");
  const [showAddressForm, setShowAddressForm] = useState(addresses.length === 0);
  const [shippingId, setShippingId] = useState(shippingMethods[0]?.id ?? "");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isChecking, startCouponCheck] = useTransition();
  const [isSubmitting, startSubmit] = useTransition();

  const shipping = shippingMethods.find((method) => method.id === shippingId);
  const shippingCost = shipping ? getShippingCost(shipping, totalPrice) : 0;
  const discount = coupon ? Math.min(coupon.discount, totalPrice) : 0;
  const payable = Math.max(0, totalPrice - discount + shippingCost);

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center rounded-3xl p-10 text-center">
        <p className="font-black text-ink">سبد خرید شما خالی است.</p>
        <Link href="/" className="btn-primary mt-5">
          مشاهده محصولات
        </Link>
      </div>
    );
  }

  const applyCoupon = () => {
    startCouponCheck(async () => {
      const result = await checkCouponAction(couponInput, totalPrice);
      setCouponMessage(result.message);
      setCoupon(result.valid ? { code: couponInput.trim().toUpperCase(), discount: result.discount } : null);
    });
  };

  const submitOrder = () => {
    setError("");
    if (!addressId) return setError("لطفاً آدرس تحویل را انتخاب یا ثبت کنید.");
    if (!shippingId) return setError("روش ارسالی فعال نیست. با پشتیبانی تماس بگیرید.");

    startSubmit(async () => {
      const result = await createOrderAction({
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
        })),
        addressId,
        shippingMethodId: shippingId,
        couponCode: coupon?.code,
        note,
      });

      if (result.requiresLogin) {
        router.push("/login?callbackUrl=%2Fcheckout");
        return;
      }
      if (!result.success) {
        setError(result.message);
        return;
      }
      clearCart();
      router.push(`/profile/orders/${result.orderId}?placed=1`);
      router.refresh();
    });
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        {/* آدرس */}
        <section className="card rounded-3xl p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-black text-ink">
              <MapPin className="h-5 w-5 text-brand-600" />
              آدرس تحویل
            </h2>
            {!showAddressForm && (
              <button type="button" onClick={() => setShowAddressForm(true)} className="flex items-center gap-1 text-xs font-bold text-brand-700">
                <Plus className="h-4 w-4" />
                آدرس جدید
              </button>
            )}
          </div>

          {showAddressForm ? (
            <AddressForm
              onSaved={(id) => {
                setAddressId(id);
                setShowAddressForm(false);
                router.refresh();
              }}
              onCancel={addresses.length > 0 ? () => setShowAddressForm(false) : undefined}
            />
          ) : (
            <div className="space-y-3">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition ${
                    address.id === addressId ? "border-brand-500 bg-brand-50/40" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={address.id === addressId}
                    onChange={() => setAddressId(address.id)}
                    className="mt-1 h-4 w-4 accent-brand-500"
                  />
                  <span className="text-sm leading-7">
                    <span className="block font-bold text-ink">
                      {address.title ? `${address.title} — ` : ""}
                      {address.province}، {address.city}
                    </span>
                    <span className="block text-slate-600">{address.address}</span>
                    <span className="block text-xs text-slate-500">
                      گیرنده: {address.recipientName} · <span dir="ltr">{address.mobile}</span> · کد پستی: {address.postalCode}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>

        {/* روش ارسال */}
        <section className="card rounded-3xl p-5 md:p-6">
          <h2 className="mb-4 flex items-center gap-2 font-black text-ink">
            <Truck className="h-5 w-5 text-brand-600" />
            روش ارسال
          </h2>
          {shippingMethods.length === 0 ? (
            <p className="text-sm text-slate-500">در حال حاضر روش ارسال فعالی وجود ندارد.</p>
          ) : (
            <div className="space-y-3">
              {shippingMethods.map((method) => {
                const cost = getShippingCost(method, totalPrice);
                return (
                  <label
                    key={method.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition ${
                      method.id === shippingId ? "border-brand-500 bg-brand-50/40" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      checked={method.id === shippingId}
                      onChange={() => setShippingId(method.id)}
                      className="h-4 w-4 accent-brand-500"
                    />
                    <span className="flex-1 text-sm">
                      <span className="block font-bold text-ink">{method.name}</span>
                      {method.description && <span className="text-xs text-slate-500">{method.description}</span>}
                      {method.freeOver !== null && cost > 0 && (
                        <span className="block text-xs text-emerald-600">
                          ارسال رایگان برای خرید بالای {method.freeOver.toLocaleString("fa-IR")} تومان
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-bold text-slate-700">
                      {cost === 0 ? "رایگان" : `${cost.toLocaleString("fa-IR")} تومان`}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </section>

        <section className="card rounded-3xl p-5 md:p-6">
          <label htmlFor="note" className="mb-2 block font-black text-ink">
            توضیحات سفارش (اختیاری)
          </label>
          <textarea
            id="note"
            rows={2}
            maxLength={500}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="مثلاً زمان مناسب تحویل"
            className="field"
          />
        </section>
      </div>

      {/* خلاصه */}
      <aside className="card space-y-5 rounded-3xl p-6 lg:sticky lg:top-32">
        <h2 className="font-black text-ink">خلاصه سفارش</h2>
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={`${item.productId}-${item.variantId ?? ""}`} className="flex justify-between gap-3 text-slate-600">
              <span className="line-clamp-1">
                {item.title}
                {item.variantName ? ` (${item.variantName})` : ""} × {item.quantity.toLocaleString("fa-IR")}
              </span>
              <span className="shrink-0">{(item.price * item.quantity).toLocaleString("fa-IR")}</span>
            </li>
          ))}
        </ul>

        <div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <TicketPercent className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value)}
                placeholder="کد تخفیف"
                dir="ltr"
                className="field py-2.5 pr-9 text-right uppercase"
              />
            </div>
            <button
              type="button"
              onClick={applyCoupon}
              disabled={isChecking || !couponInput.trim()}
              className="btn-ghost px-4 py-2.5"
            >
              {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : "اعمال"}
            </button>
          </div>
          {couponMessage && (
            <p className={`mt-2 text-xs font-bold ${coupon ? "text-emerald-600" : "text-rose-600"}`}>
              {couponMessage}
            </p>
          )}
        </div>

        <dl className="space-y-3 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between text-slate-500">
            <dt>جمع کالاها</dt>
            <dd>{totalPrice.toLocaleString("fa-IR")} تومان</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <dt>تخفیف</dt>
              <dd>− {discount.toLocaleString("fa-IR")} تومان</dd>
            </div>
          )}
          <div className="flex justify-between text-slate-500">
            <dt>هزینه ارسال</dt>
            <dd>{shippingCost === 0 ? "رایگان" : `${shippingCost.toLocaleString("fa-IR")} تومان`}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-3">
            <dt className="font-black text-ink">مبلغ قابل پرداخت</dt>
            <dd className="text-lg font-black text-ink">{payable.toLocaleString("fa-IR")} تومان</dd>
          </div>
        </dl>

        {error && (
          <p className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-bold leading-6 text-rose-700">
            {error}
          </p>
        )}

        <button type="button" onClick={submitOrder} disabled={isSubmitting} className="btn-primary w-full py-4">
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
          ثبت سفارش
        </button>
        <p className="text-center text-[11px] leading-6 text-slate-400">
          قیمت، موجودی و تخفیف هنگام ثبت سفارش دوباره بررسی می‌شود.
        </p>
      </aside>
    </div>
  );
}

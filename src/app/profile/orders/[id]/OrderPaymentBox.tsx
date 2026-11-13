"use client";

/* eslint-disable @next/next/no-img-element */
import { cancelMyOrderAction } from "@/app/actions/orderActions";
import { uploadReceiptAction, type ReceiptState } from "@/app/actions/receiptActions";
import { Check, Copy, CreditCard, Loader2, Upload, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";

type Props = {
  orderId: string;
  amount: number;
  card: { number: string; holder: string; bank: string } | null;
  receipt: { uploadedAt: string; reference: string | null; rejectNote: string | null } | null;
};

const faDigits = (value: string) => value.replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          /* دسترسی کلیپ‌بورد نیست */
        }
      }}
      className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-brand-300"
      aria-label={label}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "کپی شد" : "کپی"}
    </button>
  );
}

export default function OrderPaymentBox({ orderId, amount, card, receipt }: Props) {
  const router = useRouter();
  const [state, formAction, isUploading] = useActionState<ReceiptState, FormData>(uploadReceiptAction, { ok: true, message: "" });
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelMessage, setCancelMessage] = useState("");
  const [isCanceling, startCancel] = useTransition();

  useEffect(() => {
    if (state.ok && state.message) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  const awaitingReview = receipt && !receipt.rejectNote;
  const cardDigits = card?.number.replace(/\D/g, "") ?? "";

  return (
    <section className="card space-y-5 rounded-2xl p-5 md:p-6">
      <h2 className="flex items-center gap-2 font-black text-ink">
        <CreditCard className="h-5 w-5 text-brand-600" />
        پرداخت سفارش
      </h2>

      {card ? (
        <>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm">
            <p className="text-slate-600">
              مبلغ <strong className="text-ink">{amount.toLocaleString("fa-IR")} تومان</strong> را به کارت زیر واریز کنید و تصویر رسید را بفرستید:
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3">
              <span className="font-mono text-lg font-black tracking-wider text-ink" dir="ltr">
                {faDigits(cardDigits.replace(/(\d{4})(?=\d)/g, "$1 "))}
              </span>
              <CopyButton value={cardDigits} label="کپی شماره کارت" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                {card.holder && <>به نام <strong className="text-slate-700">{card.holder}</strong></>}
                {card.bank && <> · {card.bank}</>}
              </span>
              <span className="flex items-center gap-2">
                مبلغ: {amount.toLocaleString("fa-IR")} تومان
                <CopyButton value={String(Math.round(amount))} label="کپی مبلغ" />
              </span>
            </div>
          </div>

          {awaitingReview ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm leading-7 text-sky-800">
              رسید شما در {new Date(receipt.uploadedAt).toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" })} ارسال شد و
              در انتظار تأیید است.
              {receipt.reference && <> شماره پیگیری: <span dir="ltr">{receipt.reference}</span></>}
              <a href={`/api/receipts/${orderId}`} target="_blank" className="mr-2 font-bold underline">
                مشاهده رسید
              </a>
            </div>
          ) : (
            <form ref={formRef} action={formAction} className="space-y-3">
              {receipt?.rejectNote && (
                <p className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-bold leading-6 text-rose-700">
                  رسید قبلی تأیید نشد: {receipt.rejectNote}
                </p>
              )}
              <input type="hidden" name="orderId" value={orderId} />
              <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 p-3 text-sm text-slate-600 hover:border-brand-300">
                  {preview ? (
                    <img src={preview} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  ) : (
                    <Upload className="h-5 w-5 text-brand-600" />
                  )}
                  <span>{preview ? "تصویر رسید انتخاب شد (برای تغییر کلیک کنید)" : "انتخاب تصویر رسید"}</span>
                  <input
                    type="file"
                    name="receipt"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setPreview(file ? URL.createObjectURL(file) : null);
                    }}
                  />
                </label>
                <input name="reference" placeholder="شماره پیگیری (اختیاری)" inputMode="numeric" className="field" />
              </div>
              <button type="submit" disabled={isUploading} className="btn-primary px-5 py-2.5">
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                ارسال رسید
              </button>
            </form>
          )}
          {state.message && (
            <p className={`text-xs font-bold ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>{state.message}</p>
          )}
        </>
      ) : (
        <p className="text-sm leading-7 text-slate-600">برای هماهنگی پرداخت این سفارش با پشتیبانی فروشگاه تماس بگیرید.</p>
      )}

      {/* لغو سفارش توسط مشتری */}
      <div className="border-t border-slate-100 pt-4">
        {cancelOpen ? (
          <div className="space-y-2">
            <input
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="دلیل لغو (اختیاری)"
              className="field py-2 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isCanceling}
                onClick={() =>
                  startCancel(async () => {
                    const result = await cancelMyOrderAction(orderId, cancelReason);
                    setCancelMessage(result.message);
                    if (result.success) router.refresh();
                  })
                }
                className="btn border border-rose-200 bg-white px-4 py-2 text-xs text-rose-600 hover:bg-rose-50"
              >
                {isCanceling && <Loader2 className="h-4 w-4 animate-spin" />}
                بله، سفارش لغو شود
              </button>
              <button type="button" onClick={() => setCancelOpen(false)} className="btn-ghost px-4 py-2 text-xs">
                منصرف شدم
              </button>
            </div>
            {cancelMessage && <p className="text-xs font-bold text-rose-700">{cancelMessage}</p>}
          </div>
        ) : (
          <button type="button" onClick={() => setCancelOpen(true)} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600">
            <XCircle className="h-4 w-4" />
            لغو این سفارش
          </button>
        )}
      </div>
    </section>
  );
}

"use client";

/* eslint-disable @next/next/no-img-element */
import { createReturnAction } from "@/app/actions/returnActions";
import { RETURN_REASONS } from "@/lib/checkout";
import { Loader2, Minus, PackageOpen, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Item = { id: string; title: string; variantName: string | null; imageUrl: string | null; returnable: number };

export default function ReturnRequestForm({
  orderId,
  items,
  deadlineLabel,
}: {
  orderId: string;
  items: Item[];
  deadlineLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCount = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
  const setQuantity = (id: string, value: number, max: number) =>
    setQuantities((current) => ({ ...current, [id]: Math.max(0, Math.min(max, value)) }));

  if (!open) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          اگر کالا مشکل دارد یا از خرید منصرف شده‌اید، تا <strong>{deadlineLabel}</strong> می‌توانید درخواست مرجوعی ثبت کنید.
        </p>
        <button type="button" onClick={() => setOpen(true)} className="btn-ghost px-4 py-2 text-xs">
          <PackageOpen className="h-4 w-4" />
          ثبت درخواست مرجوعی
        </button>
      </div>
    );
  }

  const submit = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await createReturnAction({
        orderId,
        items: Object.entries(quantities).map(([orderItemId, quantity]) => ({ orderItemId, quantity })),
        reason,
        description,
      });
      setMessage({ ok: result.success, text: result.message });
      if (result.success) {
        setOpen(false);
        setQuantities({});
        setReason("");
        setDescription("");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-bold text-slate-700">کدام کالاها را مرجوع می‌کنید؟</p>
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {items.map((item) => {
            const quantity = quantities[item.id] ?? 0;
            return (
              <li key={item.id} className={`flex items-center gap-3 p-3 ${item.returnable === 0 ? "opacity-50" : ""}`}>
                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                  {item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="line-clamp-1 font-bold text-ink">{item.title}</span>
                  <span className="text-xs text-slate-500">
                    {item.variantName ? `${item.variantName} · ` : ""}
                    {item.returnable > 0 ? `قابل مرجوع: ${item.returnable.toLocaleString("fa-IR")} عدد` : "قبلاً درخواست شده"}
                  </span>
                </span>
                {item.returnable > 0 && (
                  <span className="flex items-center rounded-xl border border-slate-200">
                    <button type="button" aria-label="افزایش" onClick={() => setQuantity(item.id, quantity + 1, item.returnable)} className="p-2 text-slate-600 hover:text-brand-700">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{quantity.toLocaleString("fa-IR")}</span>
                    <button type="button" aria-label="کاهش" onClick={() => setQuantity(item.id, quantity - 1, item.returnable)} className="p-2 text-slate-600 hover:text-brand-700">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <label htmlFor="return-reason" className="mb-1.5 block text-sm font-bold text-slate-700">دلیل مرجوعی</label>
        <select id="return-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="field">
          <option value="" disabled>انتخاب کنید</option>
          {RETURN_REASONS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="return-description" className="mb-1.5 block text-sm font-bold text-slate-700">
          توضیحات {reason === "سایر" ? "" : "(اختیاری)"}
        </label>
        <textarea
          id="return-description"
          rows={3}
          maxLength={1000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="مثلاً نوع ایراد یا آسیب را توضیح دهید"
          className="field"
        />
      </div>

      {message && (
        <p className={`rounded-xl border p-3 text-xs font-bold ${message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700"}`}>
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={submit} disabled={isPending || selectedCount === 0 || !reason} className="btn-primary px-5 py-2.5">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          ثبت درخواست ({selectedCount.toLocaleString("fa-IR")} کالا)
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost px-5 py-2.5">
          انصراف
        </button>
      </div>
    </div>
  );
}

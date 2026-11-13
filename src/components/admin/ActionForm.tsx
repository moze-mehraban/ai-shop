"use client";

import type { FormState } from "@/app/actions/adminCatalogActions";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { createContext, startTransition, useActionState, useContext, useEffect, useRef } from "react";

// وضعیت «در حال ذخیره» برای دکمه ذخیره داخل فرم
const ActionFormPending = createContext<boolean | null>(null);
export function useActionFormPending() {
  return useContext(ActionFormPending);
}

/**
 * فرم مدیریتی با نمایش پیام موفقیت/خطای سرور.
 *
 * فرم عمداً از طریق onSubmit ارسال می‌شود (نه prop «action»)، چون React بعد از ارسال
 * موفقِ فرم‌های action فیلدها را خودکار reset می‌کند و فیلدها به مقدار قبلی برمی‌گشتند؛
 * در نتیجه با ذخیره دوباره، اطلاعات قدیمی روی تغییرات جدید نوشته می‌شد.
 * حالا فیلدها همان مقداری را نگه می‌دارند که ذخیره شده است.
 */
export default function ActionForm({
  action,
  children,
  className = "",
  resetOnSuccess = false,
  confirmMessage,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  confirmMessage?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, { ok: true, message: "" });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form || !state.ok || !state.message) return;

    if (resetOnSuccess) {
      // فرم‌های «افزودن» (دسته جدید، کد تخفیف جدید و ...) بعد از موفقیت خالی می‌شوند
      form.reset();
    } else {
      // فایل‌های انتخاب‌شده آپلود شده‌اند؛ پاک می‌شوند تا با ذخیره بعدی دوباره آپلود نشوند
      form.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((input) => {
        input.value = "";
      });
    }
  }, [state, resetOnSuccess]);

  return (
    <ActionFormPending.Provider value={isPending}>
      <form
        ref={formRef}
        className={className}
        onSubmit={(event) => {
          event.preventDefault();
          if (isPending) return;
          if (confirmMessage && !window.confirm(confirmMessage)) return;
          const formData = new FormData(event.currentTarget);
          startTransition(() => formAction(formData));
        }}
      >
        {children}
        {state.message && (
          <p
            role="status"
            className={`col-span-full mt-3 flex items-start gap-2 rounded-xl border p-3 text-xs font-bold leading-6 ${
              state.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-100 bg-rose-50 text-rose-700"
            }`}
          >
            {state.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <CircleAlert className="h-4 w-4 shrink-0" />}
            {state.message}
          </p>
        )}
      </form>
    </ActionFormPending.Provider>
  );
}

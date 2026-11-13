"use client";

import { setPasswordAction, type PasswordState } from "@/app/actions/passwordActions";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";

export default function PasswordForm({ hasPassword, canSkipCurrent }: { hasPassword: boolean; canSkipCurrent: boolean }) {
  const [state, formAction, isPending] = useActionState<PasswordState, FormData>(setPasswordAction, { ok: true, message: "" });
  const [show, setShow] = useState(false);
  const type = show ? "text" : "password";
  const needsCurrent = hasPassword && !canSkipCurrent;

  return (
    <section className="card rounded-3xl p-6">
      <h2 className="flex items-center gap-2 font-black text-ink">
        <KeyRound className="h-5 w-5 text-brand-600" />
        رمز عبور
      </h2>
      <p className="mt-1 text-xs leading-6 text-slate-500">
        {hasPassword
          ? "می‌توانید با شماره موبایل و رمز عبور، یا با کد پیامکی وارد شوید."
          : "با تنظیم رمز عبور، بدون نیاز به کد پیامکی هم می‌توانید وارد شوید."}
      </p>

      <form action={formAction} className="mt-4 space-y-3">
        {needsCurrent && (
          <input name="current" type={type} required autoComplete="current-password" placeholder="رمز عبور فعلی" className="field py-2.5" />
        )}
        <input name="password" type={type} required autoComplete="new-password" placeholder="رمز عبور جدید (حداقل ۸ کاراکتر، حرف و عدد)" className="field py-2.5" />
        <input name="confirm" type={type} required autoComplete="new-password" placeholder="تکرار رمز عبور جدید" className="field py-2.5" />
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
          <input type="checkbox" checked={show} onChange={(event) => setShow(event.target.checked)} className="h-4 w-4 accent-brand-500" />
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          نمایش رمز
        </label>
        {state.message && (
          <p className={`rounded-xl border p-3 text-xs font-bold leading-6 ${state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700"}`}>
            {state.message}
          </p>
        )}
        <button type="submit" disabled={isPending} className="btn-primary w-full py-2.5">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {hasPassword ? "تغییر رمز عبور" : "تنظیم رمز عبور"}
        </button>
      </form>
    </section>
  );
}

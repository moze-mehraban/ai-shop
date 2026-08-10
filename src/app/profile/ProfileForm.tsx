"use client";

import {
  type ProfileActionState,
  updateProfileAction,
} from "@/app/actions/profileActions";
import { CheckCircle2, Loader2, Mail, Smartphone, UserRound } from "lucide-react";
import { useSession } from "next-auth/react";
import { useActionState, useEffect } from "react";

const initialState: ProfileActionState = {
  status: "idle",
  message: "",
};

export default function ProfileForm({
  name,
  email,
  mobile,
}: {
  name: string;
  email: string;
  mobile: string;
}) {
  const { update } = useSession();
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      void update();
    }
  }, [state.status, update]);

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
    >
      <div className="mb-7">
        <p className="text-xs font-bold text-[#ef394e]">اطلاعات شخصی</p>
        <h2 className="mt-1 text-xl font-black text-slate-900">
          تکمیل حساب کاربری
        </h2>
        <p className="mt-2 text-xs leading-6 text-slate-500">
          این اطلاعات در سفارش‌ها و بخش‌های شخصی حساب شما استفاده می‌شود.
        </p>
      </div>

      <div className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-xs font-bold text-slate-600">
            نام و نام خانوادگی
          </span>
          <div className="relative">
            <UserRound className="absolute top-3.5 right-3.5 h-4 w-4 text-slate-400" />
            <input
              name="name"
              defaultValue={name}
              minLength={2}
              maxLength={80}
              required
              autoComplete="name"
              placeholder="مثلاً اصفر فرهادی"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-4 text-sm text-slate-800 outline-none transition focus:border-[#ef394e] focus:bg-white focus:ring-4 focus:ring-[#ef394e]/10"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold text-slate-600">
            ایمیل
          </span>
          <div className="relative">
            <Mail className="absolute top-3.5 right-3.5 h-4 w-4 text-slate-400" />
            <input
              name="email"
              type="email"
              defaultValue={email}
              maxLength={150}
              required
              autoComplete="email"
              dir="ltr"
              placeholder="name@example.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-4 text-left text-sm text-slate-800 outline-none transition focus:border-[#ef394e] focus:bg-white focus:ring-4 focus:ring-[#ef394e]/10"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold text-slate-600">
            شماره موبایل
          </span>
          <div className="relative">
            <Smartphone className="absolute top-3.5 right-3.5 h-4 w-4 text-slate-400" />
            <input
              value={mobile}
              readOnly
              dir="ltr"
              className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 py-3 pr-10 pl-4 text-left text-sm text-slate-500 outline-none"
            />
          </div>
          <span className="mt-2 block text-[10px] text-slate-400">
            شماره موبایل شناسه ورود شماست و از این بخش تغییر نمی‌کند.
          </span>
        </label>
      </div>

      <div aria-live="polite" className="min-h-8">
        {state.message && (
          <p
            className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold ${
              state.status === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            {state.status === "success" && (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {state.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ef394e] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-200 transition hover:bg-[#d82a3d] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "در حال ذخیره..." : "ذخیره اطلاعات"}
      </button>
    </form>
  );
}

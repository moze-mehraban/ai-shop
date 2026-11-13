'use client';

import { useState, useRef } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, KeyRound, Loader2, ShieldCheck, Smartphone, Sparkles, Truck } from 'lucide-react';
import { requestOtpAction } from '@/app/actions/authActions';
import { MOBILE_PATTERN, normalizeDigits, normalizeMobile } from '@/lib/digits';

export default function LoginClient({
  shopName,
  shopTagline,
}: {
  shopName: string;
  shopTagline: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // جلوگیری از ارسال دوباره درخواست کد با دوبار کلیک/Enter سریع (هر پیامک هزینه دارد)
  const sendingRef = useRef(false);

  // ثبت شماره موبایل و درخواست کد
  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedMobile = normalizeMobile(mobile);

    if (!MOBILE_PATTERN.test(normalizedMobile)) {
      setError('لطفاً شماره موبایل معتبر وارد کنید (مثال: 09123456789)');
      return;
    }

    if (sendingRef.current) return;
    sendingRef.current = true;
    setLoading(true);
    try {
      const res = await requestOtpAction(normalizedMobile);
      if (!res.success) {
        setError(res.error || 'خطایی در ارسال کد رخ داد.');
        setLoading(false);
        return;
      }

      setMobile(normalizedMobile);
      setStep(2);
    } catch {
      setError('خطا در ارتباط با سرور.');
    } finally {
      sendingRef.current = false;
      setLoading(false);
    }
  };

  // مدیریت ورود اعداد OTP (چپ به راست)
  const handleOtpChange = (index: number, rawValue: string) => {
    const value = normalizeDigits(rawValue);
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // مدیریت کلید Backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // مدیریت جایگذاری (Paste) کد ۵ رقمی
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = normalizeDigits(e.clipboardData.getData('text')).trim();
    if (/^\d{5}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[4]?.focus();
    }
  };

  // تایید نهایی کد و لاگین
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otp.join('');

    if (fullCode.length < 5) {
      setError('لطفاً کد ۵ رقمی را کامل وارد کنید.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        mobile,
        code: fullCode,
        redirect: false,
      });

      if (res?.error) {
        setError('کد تایید اشتباه یا منقضی شده است.');
        setLoading(false);
      } else {
        const requestedCallback = new URLSearchParams(window.location.search).get('callbackUrl');
        const callbackUrl =
          requestedCallback?.startsWith('/') && !requestedCallback.startsWith('//')
            ? requestedCallback
            : '/profile';

        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('خطا در برقراری ارتباط با سرور.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* پنل برند (فقط دسکتاپ) */}
      <aside className="relative hidden w-[44%] shrink-0 overflow-hidden border-l border-slate-200/70 bg-slate-50 p-12 text-ink lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-amber-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-brand-100/80 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-2.5 self-start">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xl font-black" dir="auto">
              {shopName}
            </span>
            {shopTagline && <span className="text-[11px] text-slate-500">{shopTagline}</span>}
          </span>
        </Link>
        <div className="relative">
          <h2 className="text-4xl leading-[1.5] font-black">
            خرید هوشمند،
            <br />
            <span className="bg-gradient-to-l from-brand-600 to-ai-500 bg-clip-text text-transparent">
              تصمیم مطمئن
            </span>
          </h2>
          <ul className="mt-8 space-y-4 text-sm text-slate-700">
            {[
              { Icon: Sparkles, text: "خلاصه هوشمند دیدگاه خریداران" },
              { Icon: ShieldCheck, text: "ورود امن با کد یک‌بارمصرف" },
              { Icon: Truck, text: "پیگیری سفارش‌ها در پروفایل" },
            ].map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white">
                  <Icon className="h-4 w-4 text-brand-600" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-600">
          ورود شما به معنی پذیرش قوانین فروشگاه است.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* لوگو در موبایل و تبلت (پنل برند فقط در دسکتاپ نمایش داده می‌شود) */}
          <Link href="/" className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-black text-ink" dir="auto">
                {shopName}
              </span>
              {shopTagline && <span className="text-[11px] text-slate-400">{shopTagline}</span>}
            </span>
          </Link>
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-brand-600"
          >
            <ArrowRight className="h-4 w-4" />
            بازگشت به فروشگاه
          </Link>

          <div className="card space-y-7 p-6 sm:p-8">
            {/* هدر فرم */}
            <div className="space-y-2">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                {step === 1 ? <Smartphone className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
              </span>
              <h1 className="text-xl font-black text-ink">
                {step === 1 ? 'ورود | ثبت‌نام' : 'کد تایید را وارد کنید'}
              </h1>
              <p className="text-sm leading-7 text-slate-500">
                {step === 1 ? (
                  'شماره موبایل خود را برای ورود وارد کنید'
                ) : (
                  <>
                    کد ۵ رقمی ارسال‌شده به شماره{' '}
                    <span className="font-bold text-slate-800" dir="ltr">{mobile}</span>
                  </>
                )}
              </p>
            </div>

            {/* فرم مرحله اول: شماره موبایل */}
            {step === 1 ? (
              <form onSubmit={handleMobileSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="mobile" className="block text-xs font-bold text-slate-700">
                    شماره موبایل
                  </label>
                  <div className="relative">
                    <input
                      id="mobile"
                      type="text"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="09123456789"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      dir="ltr"
                      className="field py-3.5 pl-11 text-right text-base tracking-wider"
                    />
                    <Smartphone className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-center text-xs font-bold text-rose-700">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'در حال ارسال...' : 'ارسال کد تایید'}
                </button>
              </form>
            ) : (
              /* فرم مرحله دوم: ورود کد OTP (چپ به راست واقعی) */
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                {/* استفاده از ویژگی استاندارد dir="ltr" برای اجبار جهت چپ به راست */}
                <div className="flex items-center justify-center gap-2 sm:gap-3" dir="ltr" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      aria-label={`رقم ${index + 1}`}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      dir="ltr"
                      className={`h-14 w-12 rounded-xl border-2 text-center text-2xl font-black text-ink transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none sm:w-14 ${
                        digit ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-center text-xs font-bold text-rose-700">
                    {error}
                  </p>
                )}

                <div className="space-y-2">
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? 'در حال بررسی...' : 'تایید و ورود'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp(['', '', '', '', '']);
                      setError('');
                    }}
                    className="flex w-full items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                  >
                    <ArrowRight className="h-4 w-4" />
                    <span>ویرایش شماره موبایل</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

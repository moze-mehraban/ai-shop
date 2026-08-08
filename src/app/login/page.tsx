'use client';

import { useState, useRef } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Smartphone } from 'lucide-react';
import { requestOtpAction } from '@/app/actions/authActions';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ثبت شماره موبایل و درخواست کد
  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^09\d{9}$/.test(mobile)) {
      setError('لطفاً شماره موبایل معتبر وارد کنید (مثال: 09123456789)');
      return;
    }

    setLoading(true);
    try {
      const res = await requestOtpAction(mobile);
      if (!res.success) {
        setError(res.error || 'خطایی در ارسال کد رخ داد.');
        setLoading(false);
        return;
      }

      setStep(2);
    } catch {
      setError('خطا در ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  // مدیریت ورود اعداد OTP (چپ به راست)
  const handleOtpChange = (index: number, value: string) => {
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
    const pastedData = e.clipboardData.getData('text').trim();
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
            : '/';

        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('خطا در برقراری ارتباط با سرور.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-8 space-y-6">

        {/* هدر فرم */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block bg-[#ef394e] text-white px-4 py-2 rounded-xl font-black text-lg tracking-tighter">
            AI-Shop
          </Link>
          <h1 className="text-lg font-bold text-slate-800 pt-2">
            {step === 1 ? 'ورود | ثبت‌نام' : 'کد تایید را وارد کنید'}
          </h1>
          <p className="text-xs text-slate-500">
            {step === 1
              ? 'شماره موبایل خود را برای ورود وارد کنید'
              : `کد ارسال‌شده به شماره ${mobile}`}
          </p>
        </div>

        {/* فرم مرحله اول: شماره موبایل */}
        {step === 1 ? (
          <form onSubmit={handleMobileSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">شماره موبایل</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="09123456789"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm py-3 px-4 rounded-xl focus:bg-white focus:border-[#ef394e] focus:ring-2 focus:ring-[#ef394e]/20 focus:outline-none transition-all dir-ltr text-right"
                />
                <Smartphone className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-500 bg-rose-50 p-2.5 rounded-xl border border-rose-100 text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ef394e] hover:bg-[#d82a3f] text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-[#ef394e]/20 text-sm disabled:opacity-50"
            >
              {loading ? 'در حال ارسال...' : 'ارسال کد تایید'}
            </button>
          </form>
        ) : (
          /* فرم مرحله دوم: ورود کد OTP (چپ به راست واقعی) */
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            {/* استفاده از ویژگی استاندارد dir="ltr" برای اجبار جهت چپ به راست */}
            <div className="flex items-center justify-center gap-2.5" dir="ltr" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  dir="ltr"
                  className="w-12 h-12 text-center text-xl font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#ef394e] focus:ring-2 focus:ring-[#ef394e]/20 focus:outline-none transition-all"
                />
              ))}
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-500 text-center bg-rose-50 py-2.5 rounded-xl border border-rose-100">
                {error}
              </p>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ef394e] hover:bg-[#d82a3f] text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-[#ef394e]/20 text-sm disabled:opacity-50"
              >
                {loading ? 'در حال بررسی...' : 'تایید و ورود'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp(['', '', '', '', '']);
                  setError('');
                }}
                className="w-full text-slate-500 hover:text-slate-800 text-xs font-bold py-2 transition-colors flex items-center justify-center gap-1"
              >
                <ArrowRight className="w-4 h-4" />
                <span>ویرایش شماره موبایل</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

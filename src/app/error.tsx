"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
      <TriangleAlert className="h-14 w-14 text-orange-400" />
      <h1 className="mt-5 text-xl font-black text-ink">مشکلی پیش آمد</h1>
      <p className="mt-2 text-sm leading-7 text-slate-500">
        در نمایش این صفحه خطایی رخ داد. لطفاً دوباره تلاش کنید.
      </p>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={() => retry()} className="btn-primary">
          <RefreshCw className="h-4 w-4" />
          تلاش دوباره
        </button>
        <Link href="/" className="btn-ghost">صفحه اصلی</Link>
      </div>
    </main>
  );
}

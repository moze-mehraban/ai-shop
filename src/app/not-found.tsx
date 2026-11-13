import DigikalaHeader from "@/components/DigikalaHeader";
import SiteFooter from "@/components/SiteFooter";
import { SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas">
      <DigikalaHeader />
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        <SearchX className="h-16 w-16 text-slate-300" />
        <p className="mt-6 text-5xl font-black text-ink">۴۰۴</p>
        <h1 className="mt-3 text-lg font-black text-ink">صفحه‌ای که دنبالش بودید پیدا نشد</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          ممکن است آدرس اشتباه باشد یا این کالا دیگر در فروشگاه موجود نباشد.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/" className="btn-primary">صفحه اصلی</Link>
          <Link href="/search" className="btn-ghost">همه محصولات</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

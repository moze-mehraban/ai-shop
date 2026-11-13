import { getSettings } from "@/lib/settings";
import { Mail, MapPin, Phone, ShieldCheck, Smartphone, Sparkles, Truck } from "lucide-react";
import Link from "next/link";

const perks = [
  { Icon: Truck, title: "ارسال به سراسر کشور", text: "انتخاب روش ارسال هنگام خرید" },
  { Icon: ShieldCheck, title: "ضمانت اصالت", text: "تضمین اصل بودن کالا" },
  { Icon: Sparkles, title: "خلاصه هوشمند نظرات", text: "تصمیم سریع‌تر با AI" },
  { Icon: Smartphone, title: "ورود با پیامک", text: "بدون نیاز به رمز عبور" },
];

const links = [
  {
    title: "خرید",
    items: [
      { href: "/search", label: "همه محصولات" },
      { href: "/search?sort=bestselling", label: "پرفروش‌ترین‌ها" },
      { href: "/search?sort=discount", label: "تخفیف‌دارها" },
      { href: "/cart", label: "سبد خرید" },
    ],
  },
  {
    title: "حساب کاربری",
    items: [
      { href: "/profile", label: "اطلاعات حساب" },
      { href: "/profile/orders", label: "پیگیری سفارش" },
      { href: "/profile/addresses", label: "آدرس‌ها" },
      { href: "/profile/wishlist", label: "علاقه‌مندی‌ها" },
    ],
  },
  {
    title: "راهنما",
    items: [
      { href: "/about", label: "درباره ما" },
      { href: "/contact", label: "تماس با ما" },
      { href: "/terms", label: "قوانین و مقررات" },
      { href: "/privacy", label: "حریم خصوصی" },
      { href: "/returns", label: "شرایط بازگشت کالا" },
    ],
  },
];

export default async function SiteFooter() {
  const settings = await getSettings();
  const year = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric" }).format(new Date());

  return (
    <footer className="print:hidden mt-16 border-t border-slate-200/70 bg-white">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="grid grid-cols-2 gap-4 border-b border-slate-100 py-8 md:grid-cols-4">
          {perks.map(({ Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">{title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-8 py-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="max-w-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-lg font-black text-ink">{settings.shopName}</span>
            </div>
            <ul className="space-y-2 text-sm text-slate-500">
              {settings.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <a href={`tel:${settings.phone}`} dir="ltr" className="hover:text-brand-600">{settings.phone}</a>
                </li>
              )}
              {settings.email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <a href={`mailto:${settings.email}`} className="hover:text-brand-600">{settings.email}</a>
                </li>
              )}
              {settings.address && (
                <li className="flex items-start gap-2 leading-7">
                  <MapPin className="mt-1.5 h-4 w-4 shrink-0 text-slate-400" />
                  {settings.address}
                </li>
              )}
            </ul>
            <div className="flex gap-3 text-sm font-bold">
              {settings.instagram && (
                <a href={`https://instagram.com/${settings.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-brand-600">
                  اینستاگرام
                </a>
              )}
              {settings.telegram && (
                <a href={`https://t.me/${settings.telegram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-brand-600">
                  تلگرام
                </a>
              )}
            </div>
          </div>

          {links.map((group) => (
            <div key={group.title}>
              <p className="text-sm font-black text-ink">{group.title}</p>
              <ul className="mt-4 space-y-3">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-slate-500 transition hover:text-brand-600">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {settings.enamadHtml && (
          // کد نماد اعتماد فقط توسط مدیر از پنل تنظیمات وارد می‌شود
          <div className="flex justify-center border-t border-slate-100 py-6" dangerouslySetInnerHTML={{ __html: settings.enamadHtml }} />
        )}

        <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-100 py-5 text-xs text-slate-400 sm:flex-row">
          <p>© {year} {settings.shopName} — تمامی حقوق محفوظ است.</p>
        </div>
      </div>
    </footer>
  );
}

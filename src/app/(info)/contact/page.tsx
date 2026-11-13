import { getSettings } from "@/lib/settings";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import InfoPage from "../InfoPage";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "تماس با ما" };
}

export default async function ContactPage() {
  const settings = await getSettings();
  const rows = [
    { Icon: Phone, label: "تلفن", value: settings.phone, href: settings.phone ? `tel:${settings.phone}` : undefined, ltr: true },
    { Icon: Mail, label: "ایمیل", value: settings.email, href: settings.email ? `mailto:${settings.email}` : undefined, ltr: true },
    { Icon: Clock, label: "ساعات پاسخگویی", value: settings.workingHours },
    { Icon: MapPin, label: "آدرس", value: settings.address },
  ].filter((row) => row.value);

  return (
    <InfoPage title="تماس با ما">
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">اطلاعات تماس به‌زودی تکمیل می‌شود.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map(({ Icon, label, value, href, ltr }) => (
            <li key={label} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-500">{label}</p>
                {href ? (
                  <a href={href} dir={ltr ? "ltr" : undefined} className="mt-0.5 block font-bold text-ink hover:text-brand-700">
                    {value}
                  </a>
                ) : (
                  <p className="mt-0.5 leading-7 font-bold whitespace-pre-line text-ink">{value}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </InfoPage>
  );
}

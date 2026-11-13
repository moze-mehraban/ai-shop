import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/Providers";
import { getSettings } from "@/lib/settings";
import { getSiteUrl } from "@/lib/siteUrl";

// Vazirmatn (OFL) self-hosted so the build does not depend on Google Fonts.
const vazirmatn = localFont({
  src: "./fonts/Vazirmatn-Variable.woff2",
  weight: "100 900",
  variable: "--font-vazirmatn",
  display: "swap",
});

// عنوان تب مرورگر از «تنظیمات فروشگاه» خوانده می‌شود؛ صفحات فقط عنوان خودشان را می‌دهند
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: settings.shopTagline ? `${settings.shopName} | ${settings.shopTagline}` : settings.shopName,
      template: `%s | ${settings.shopName}`,
    },
    description: settings.shopTagline || "فروشگاه اینترنتی",
    openGraph: { locale: "fa_IR", siteName: settings.shopName },
    // نصب روی صفحه اصلی آیفون
    appleWebApp: { capable: true, title: settings.shopName, statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffa07c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="bg-canvas font-sans text-slate-800 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

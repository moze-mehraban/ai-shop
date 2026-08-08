import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "AI-Shop | فروشگاه هوشمند",
  description: "فروشگاه اینترنتی با قابلیت تحلیل هوشمند نظرات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased bg-slate-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
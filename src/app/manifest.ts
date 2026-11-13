import { getSettings } from "@/lib/settings";
import type { MetadataRoute } from "next";

// نام و توضیح اپلیکیشن از «تنظیمات فروشگاه» خوانده می‌شود
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSettings();
  return {
    name: settings.shopTagline ? `${settings.shopName} | ${settings.shopTagline}` : settings.shopName,
    short_name: settings.shopName,
    description: settings.shopTagline || "فروشگاه اینترنتی",
    lang: "fa",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffa07c",
    categories: ["shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "سبد خرید", url: "/cart" },
      { name: "سفارش‌های من", url: "/profile/orders" },
    ],
  };
}

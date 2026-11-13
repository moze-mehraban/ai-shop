import HeaderClient from "@/components/HeaderClient";
import { getSettings } from "@/lib/settings";

// نام و شعار فروشگاه از «تنظیمات فروشگاه» در پنل مدیریت خوانده می‌شود
export default async function DigikalaHeader() {
  const settings = await getSettings();
  return <HeaderClient shopName={settings.shopName} shopTagline={settings.shopTagline} />;
}

import { getSettings } from "@/lib/settings";
import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "ورود | ثبت‌نام",
  robots: { index: false },
};

export default async function LoginPage() {
  const settings = await getSettings();
  return <LoginClient shopName={settings.shopName} shopTagline={settings.shopTagline} />;
}

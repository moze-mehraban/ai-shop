import { getSettings } from "@/lib/settings";
import type { Metadata } from "next";
import InfoPage from "../InfoPage";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "قوانین و مقررات" };
}

export default async function Page() {
  const settings = await getSettings();
  return <InfoPage title="قوانین و مقررات" content={settings.termsText} />;
}

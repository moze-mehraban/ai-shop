import { getSettings } from "@/lib/settings";
import type { Metadata } from "next";
import InfoPage from "../InfoPage";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "درباره ما" };
}

export default async function Page() {
  const settings = await getSettings();
  return <InfoPage title="درباره ما" content={settings.aboutText} />;
}

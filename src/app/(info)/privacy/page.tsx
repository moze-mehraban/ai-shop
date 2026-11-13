import { getSettings } from "@/lib/settings";
import type { Metadata } from "next";
import InfoPage from "../InfoPage";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "حریم خصوصی" };
}

export default async function Page() {
  const settings = await getSettings();
  return <InfoPage title="حریم خصوصی" content={settings.privacyText} />;
}

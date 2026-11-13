import { getSettings } from "@/lib/settings";
import type { Metadata } from "next";
import InfoPage from "../InfoPage";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "شرایط بازگشت کالا" };
}

export default async function Page() {
  const settings = await getSettings();
  return <InfoPage title="شرایط بازگشت کالا" content={settings.returnsText} />;
}

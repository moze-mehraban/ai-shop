import DigikalaHeader from "@/components/DigikalaHeader";
import SiteFooter from "@/components/SiteFooter";
import ProfileNavigation from "@/components/ProfileNavigation";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fprofile");
  }

  return (
    <div className="min-h-screen bg-canvas">
      <DigikalaHeader />
      <ProfileNavigation />
      {children}
      <SiteFooter />
    </div>
  );
}

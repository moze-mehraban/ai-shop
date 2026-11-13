import DigikalaHeader from "@/components/DigikalaHeader";
import SiteFooter from "@/components/SiteFooter";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "تسویه حساب",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fcheckout");
  }

  const [addresses, shippingMethods] = await Promise.all([
    prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { cost: "asc" }],
    }),
  ]);

  return (
    <div className="min-h-screen bg-canvas">
      <DigikalaHeader />
      <main className="mx-auto max-w-[1200px] px-4 py-8">
        <h1 className="mb-6 text-2xl font-black text-ink">تسویه حساب</h1>
        <CheckoutClient
          addresses={addresses.map((address) => ({
            id: address.id,
            title: address.title,
            recipientName: address.recipientName,
            mobile: address.mobile,
            province: address.province,
            city: address.city,
            address: address.address,
            postalCode: address.postalCode,
            isDefault: address.isDefault,
          }))}
          shippingMethods={shippingMethods.map((method) => ({
            id: method.id,
            name: method.name,
            description: method.description,
            cost: method.cost,
            freeOver: method.freeOver,
          }))}
        />
      </main>
      <SiteFooter />
    </div>
  );
}

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AddressBook from "./AddressBook";

export default async function AddressesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fprofile%2Faddresses");
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-lg font-black text-ink">آدرس‌های من</h1>
      <AddressBook
        addresses={addresses.map((address) => ({
          id: address.id,
          title: address.title ?? "",
          recipientName: address.recipientName,
          mobile: address.mobile,
          province: address.province,
          city: address.city,
          address: address.address,
          postalCode: address.postalCode,
          isDefault: address.isDefault,
        }))}
      />
    </main>
  );
}

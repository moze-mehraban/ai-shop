import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export async function requireAdmin(callbackUrl = "/admin") {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return session;
}

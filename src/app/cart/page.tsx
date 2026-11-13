import DigikalaHeader from "@/components/DigikalaHeader";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";
import CartClient from "./CartClient";

export const metadata: Metadata = {
  title: "سبد خرید",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <div className="min-h-screen bg-canvas text-slate-800">
      <DigikalaHeader />
      <CartClient />
      <SiteFooter />
    </div>
  );
}

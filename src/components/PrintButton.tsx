"use client";

import { Download, Printer } from "lucide-react";

// چاپ یا ذخیره به PDF از طریق پنجره چاپ مرورگر (متن فارسی درست حفظ می‌شود)
export default function PrintButton({ variant = "print" }: { variant?: "print" | "pdf" }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary px-4 py-2">
      {variant === "pdf" ? <Download className="h-4 w-4" /> : <Printer className="h-4 w-4" />}
      {variant === "pdf" ? "دانلود PDF" : "چاپ"}
    </button>
  );
}

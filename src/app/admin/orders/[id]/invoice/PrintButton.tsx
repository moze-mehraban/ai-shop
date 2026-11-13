"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary px-4 py-2">
      <Printer className="h-4 w-4" />
      چاپ
    </button>
  );
}

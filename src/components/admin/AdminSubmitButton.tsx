"use client";

import { useActionFormPending } from "@/components/admin/ActionForm";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export default function AdminSubmitButton({
  children,
  className = "",
  pendingLabel = "در حال ذخیره...",
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending: formPending } = useFormStatus();
  // داخل ActionForm وضعیت از خود فرم می‌آید؛ در فرم‌های ساده از useFormStatus
  const actionFormPending = useActionFormPending();
  const pending = actionFormPending ?? formPending;

  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? pendingLabel : children}
    </button>
  );
}

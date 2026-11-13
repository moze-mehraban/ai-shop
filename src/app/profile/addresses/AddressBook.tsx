"use client";

import { deleteAddressAction, type AddressInput } from "@/app/actions/addressActions";
import AddressForm from "@/components/AddressForm";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Address = Required<Pick<AddressInput, "id">> & AddressInput;

export default function AddressBook({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(addresses.length === 0 ? "new" : null);
  const [isPending, startTransition] = useTransition();

  const done = () => {
    setEditing(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {addresses.map((address) =>
        editing === address.id ? (
          <div key={address.id} className="card rounded-2xl p-5">
            <AddressForm initial={address} onSaved={done} onCancel={() => setEditing(null)} />
          </div>
        ) : (
          <div key={address.id} className="card flex gap-4 rounded-2xl p-5">
            <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
            <div className="min-w-0 flex-1 text-sm leading-7">
              <p className="font-bold text-ink">
                {address.title ? `${address.title} — ` : ""}
                {address.province}، {address.city}
                {address.isDefault && (
                  <span className="mr-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    پیش‌فرض
                  </span>
                )}
              </p>
              <p className="text-slate-600">{address.address}</p>
              <p className="text-xs text-slate-500">
                {address.recipientName} · <span dir="ltr">{address.mobile}</span> · کد پستی {address.postalCode}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <button type="button" onClick={() => setEditing(address.id)} aria-label="ویرایش" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="حذف"
                disabled={isPending}
                onClick={() => {
                  if (!window.confirm("این آدرس حذف شود؟")) return;
                  startTransition(async () => {
                    await deleteAddressAction(address.id);
                    router.refresh();
                  });
                }}
                className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ),
      )}

      {editing === "new" ? (
        <div className="card rounded-2xl p-5">
          <h2 className="mb-4 font-black text-ink">آدرس جدید</h2>
          <AddressForm onSaved={done} onCancel={addresses.length ? () => setEditing(null) : undefined} />
        </div>
      ) : (
        <button type="button" onClick={() => setEditing("new")} className="btn-ghost w-full border-dashed">
          <Plus className="h-4 w-4" />
          افزودن آدرس جدید
        </button>
      )}
    </div>
  );
}

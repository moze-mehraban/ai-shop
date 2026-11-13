import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/admin";
import { getSettings } from "@/lib/settings";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, settings] = await Promise.all([requireAdmin(), getSettings()]);

  return (
    <div className="min-h-screen bg-canvas" dir="rtl">
      <div className="print:hidden">
        <AdminSidebar shopName={settings.shopName} />
      </div>
      <div className="lg:mr-72 print:mr-0">
        <header className="print:hidden border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur md:px-8">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400">مدیر واردشده</p>
              <p className="mt-1 text-sm font-black text-slate-800">
                {session.user.name || session.user.email || "مدیر فروشگاه"}
              </p>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              دسترسی مدیر فعال
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 md:p-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}

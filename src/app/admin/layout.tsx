import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen bg-[#f4f6f8]" dir="rtl">
      <AdminSidebar />
      <div className="lg:mr-72">
        <header className="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur md:px-8">
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
        <main className="mx-auto max-w-[1500px] p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

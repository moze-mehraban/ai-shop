import { deleteCategoryAction, saveCategoryAction } from "@/app/actions/adminCatalogActions";
import ActionForm from "@/components/admin/ActionForm";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { flattenTree, getCategoryTree, type CategoryNode } from "@/lib/categories";
import { ChevronDown, FolderPlus, FolderTree, Trash2 } from "lucide-react";

export const revalidate = 0;

function CategoryFields({
  node,
  options,
}: {
  node?: CategoryNode;
  options: { id: string; label: string }[];
}) {
  return (
    <>
      {node && <input type="hidden" name="id" value={node.id} />}
      <div>
        <label className="mb-1 block text-xs font-bold text-slate-600">نام دسته</label>
        <input name="name" required defaultValue={node?.name} className="field py-2.5" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-slate-600">نامک آدرس (slug)</label>
        <input name="slug" defaultValue={node?.slug} placeholder="خودکار از روی نام" dir="ltr" className="field py-2.5 text-right" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-slate-600">دسته والد</label>
        <select name="parentId" defaultValue={node?.parentId ?? ""} className="field py-2.5">
          <option value="">— دسته اصلی (بدون والد) —</option>
          {options
            .filter((option) => option.id !== node?.id)
            .map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-slate-600">ترتیب نمایش</label>
        <input name="sortOrder" inputMode="numeric" defaultValue={node?.sortOrder ?? 0} className="field py-2.5" />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-bold text-slate-600">توضیح (برای سئو و بالای صفحه دسته)</label>
        <textarea name="description" rows={2} defaultValue={node?.description ?? ""} className="field" />
      </div>
    </>
  );
}

export default async function AdminCategoriesPage() {
  const { roots, totals } = await getCategoryTree();
  const flat = flattenTree(roots);
  const options = flat.map(({ node, depth }) => ({ id: node.id, label: `${"— ".repeat(depth)}${node.name}` }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-ink md:text-3xl">دسته‌بندی‌ها</h1>
        <p className="mt-1 text-sm text-slate-500">
          برای ساخت زیرمجموعه، هنگام ساخت دسته «دسته والد» را انتخاب کنید.
        </p>
      </div>

      <section className="card rounded-2xl p-5">
        <h2 className="mb-4 flex items-center gap-2 font-black text-ink">
          <FolderPlus className="h-5 w-5 text-brand-600" />
          دسته جدید
        </h2>
        <ActionForm action={saveCategoryAction} resetOnSuccess className="grid gap-4 sm:grid-cols-2">
          <CategoryFields options={options} />
          <div className="sm:col-span-2">
            <AdminSubmitButton className="btn-primary">ساخت دسته</AdminSubmitButton>
          </div>
        </ActionForm>
      </section>

      <section className="card rounded-2xl p-3">
        <h2 className="flex items-center gap-2 p-2 font-black text-ink">
          <FolderTree className="h-5 w-5 text-brand-600" />
          درخت دسته‌ها
        </h2>
        {flat.length === 0 && <p className="p-6 text-center text-sm text-slate-400">هنوز دسته‌ای ساخته نشده است.</p>}
        <ul className="divide-y divide-slate-100">
          {flat.map(({ node, depth }) => (
            <li key={node.id}>
              <details className="group">
                <summary
                  className="flex cursor-pointer list-none items-center gap-3 rounded-xl p-3 hover:bg-slate-50"
                  style={{ paddingRight: `${0.75 + depth * 1.5}rem` }}
                >
                  {depth > 0 && <span className="text-slate-300">└</span>}
                  <span className="font-bold text-ink">{node.name}</span>
                  <span className="text-xs text-slate-400" dir="ltr">/{node.slug}</span>
                  <span className="mr-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-500">
                    {(totals.get(node.id) ?? 0).toLocaleString("fa-IR")} کالا
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
                </summary>
                <div className="space-y-3 bg-slate-50/60 p-4">
                  <ActionForm action={saveCategoryAction} className="grid gap-4 sm:grid-cols-2">
                    <CategoryFields node={node} options={options} />
                    <div className="sm:col-span-2">
                      <AdminSubmitButton className="btn-dark py-2.5">ذخیره</AdminSubmitButton>
                    </div>
                  </ActionForm>
                  <ActionForm action={deleteCategoryAction} confirmMessage={`دسته «${node.name}» حذف شود؟`}>
                    <input type="hidden" name="id" value={node.id} />
                    <AdminSubmitButton className="text-xs font-bold text-rose-600" pendingLabel="در حال حذف...">
                      <Trash2 className="h-4 w-4" />
                      حذف این دسته
                    </AdminSubmitButton>
                  </ActionForm>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

import { flattenTree, getCategoryTree, getDescendantIds } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { ImageIcon, PackagePlus, Search } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

const PAGE_SIZE = 25;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = String(params.q ?? "").trim().slice(0, 100);
  const status = params.status ?? "";
  const page = Math.max(1, Number(params.page) || 1);
  const { roots, nodes } = await getCategoryTree();
  const categoryNode = params.category ? nodes.get(params.category) : undefined;

  const where: Prisma.ProductWhereInput = {
    AND: [
      q ? { OR: [{ title: { contains: q } }, { brand: { contains: q } }, { id: { endsWith: q } }] } : {},
      categoryNode ? { categoryId: { in: getDescendantIds(categoryNode) } } : {},
      status === "active" ? { isActive: true } : {},
      status === "inactive" ? { isActive: false } : {},
      status === "out" ? { stock: { lte: 0 } } : {},
      status === "low" ? { stock: { gt: 0, lte: 5 } } : {},
    ],
  };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        _count: { select: { variants: true, orderItems: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (target: number) => {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (params.category) search.set("category", params.category);
    if (status) search.set("status", status);
    if (target > 1) search.set("page", String(target));
    return `/admin/products?${search.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink md:text-3xl">محصولات</h1>
          <p className="mt-1 text-sm text-slate-500">{total.toLocaleString("fa-IR")} محصول</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <PackagePlus className="h-4 w-4" />
          افزودن محصول
        </Link>
      </div>

      <form className="card grid gap-3 rounded-2xl p-4 md:grid-cols-[1fr_220px_180px_auto]">
        <div className="relative">
          <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={q} placeholder="جستجوی عنوان، برند یا کد" className="field py-2.5 pr-9" />
        </div>
        <select name="category" defaultValue={params.category ?? ""} className="field py-2.5">
          <option value="">همه دسته‌ها</option>
          {flattenTree(roots).map(({ node, depth }) => (
            <option key={node.id} value={node.id}>
              {"— ".repeat(depth)}
              {node.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status} className="field py-2.5">
          <option value="">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
          <option value="low">موجودی کم (۵ و کمتر)</option>
          <option value="out">ناموجود</option>
        </select>
        <button type="submit" className="btn-dark py-2.5">
          اعمال
        </button>
      </form>

      <div className="card overflow-hidden rounded-2xl">
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[760px] text-right text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="p-3 font-bold">محصول</th>
                <th className="p-3 font-bold">دسته</th>
                <th className="p-3 font-bold">قیمت (تومان)</th>
                <th className="p-3 font-bold">موجودی</th>
                <th className="p-3 font-bold">فروش</th>
                <th className="p-3 font-bold">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.id} className="transition hover:bg-slate-50/70">
                  <td className="p-3">
                    <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.imageUrl} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-slate-300" />
                        )}
                      </span>
                      <span>
                        <span className="line-clamp-1 font-bold text-ink hover:text-brand-700">{product.title}</span>
                        <span className="text-xs text-slate-400">
                          {product.brand ?? "بدون برند"}
                          {product._count.variants > 0 && ` · ${product._count.variants.toLocaleString("fa-IR")} تنوع`}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="p-3 text-slate-600">{product.category.name}</td>
                  <td className="p-3">
                    {product.price.toLocaleString("fa-IR")}
                    {product.discountPercent > 0 && (
                      <span className="mr-1 rounded bg-brand-50 px-1.5 text-[11px] font-bold text-brand-700">
                        {product.discountPercent.toLocaleString("fa-IR")}٪
                      </span>
                    )}
                  </td>
                  <td className={`p-3 font-bold ${product.stock <= 0 ? "text-rose-600" : product.stock <= 5 ? "text-orange-600" : "text-slate-700"}`}>
                    {product.stock.toLocaleString("fa-IR")}
                  </td>
                  <td className="p-3 text-slate-600">{product._count.orderItems.toLocaleString("fa-IR")}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${product.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {product.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    محصولی پیدا نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pageCount > 1 && (
        <nav className="flex justify-center gap-2 text-sm">
          {page > 1 && <Link href={pageHref(page - 1)} className="btn-ghost px-4 py-2">قبلی</Link>}
          <span className="px-3 py-2 text-slate-500">
            صفحه {page.toLocaleString("fa-IR")} از {pageCount.toLocaleString("fa-IR")}
          </span>
          {page < pageCount && <Link href={pageHref(page + 1)} className="btn-ghost px-4 py-2">بعدی</Link>}
        </nav>
      )}
    </div>
  );
}

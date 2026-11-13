import ProductEditor from "@/components/admin/ProductEditor";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getEditorOptions } from "../editorData";

export default async function NewProductPage() {
  const { categories, brands, specSuggestions } = await getEditorOptions();

  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-600">
        <ArrowRight className="h-4 w-4" />
        بازگشت به محصولات
      </Link>
      <h1 className="text-2xl font-black text-ink">افزودن محصول</h1>
      {categories.length === 0 ? (
        <p className="card rounded-2xl p-6 text-sm text-slate-600">
          ابتدا از بخش <Link href="/admin/categories" className="font-bold text-brand-700">دسته‌بندی‌ها</Link> یک دسته بسازید.
        </p>
      ) : (
        <ProductEditor categories={categories} brands={brands} specSuggestions={specSuggestions} />
      )}
    </div>
  );
}

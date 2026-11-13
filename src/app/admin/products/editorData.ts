import "server-only";
import { normalizeSpec } from "@/lib/catalog";
import { flattenTree, getCategoryTree } from "@/lib/categories";
import { prisma } from "@/lib/prisma";

export type SpecSuggestion = { label: string; key: boolean };

export async function getEditorOptions() {
  const [{ roots, nodes }, brandRows, products] = await Promise.all([
    getCategoryTree(),
    prisma.product.findMany({
      where: { brand: { not: null } },
      distinct: ["brand"],
      select: { brand: true },
    }),
    prisma.product.findMany({ select: { categoryId: true, specs: true } }),
  ]);

  // آمار مشخصات هر دسته: چند کالا این مشخصه را دارند و در چندتا «کلیدی» است
  type Stat = { count: number; keyCount: number; spellings: Map<string, number> };
  const byCategory = new Map<string, Map<string, Stat>>();
  for (const product of products) {
    const list = Array.isArray(product.specs) ? (product.specs as { label?: unknown; key?: unknown }[]) : [];
    const stats = byCategory.get(product.categoryId) ?? new Map<string, Stat>();
    for (const spec of list) {
      if (typeof spec?.label !== "string" || !spec.label.trim()) continue;
      const labelKey = normalizeSpec(spec.label);
      const stat = stats.get(labelKey) ?? { count: 0, keyCount: 0, spellings: new Map() };
      stat.count += 1;
      if (spec.key === true) stat.keyCount += 1;
      stat.spellings.set(spec.label.trim(), (stat.spellings.get(spec.label.trim()) ?? 0) + 1);
      stats.set(labelKey, stat);
    }
    byCategory.set(product.categoryId, stats);
  }

  const toSuggestions = (stats: Map<string, Stat>): SpecSuggestion[] =>
    [...stats.values()]
      .sort((a, b) => b.keyCount - a.keyCount || b.count - a.count)
      .slice(0, 8)
      .map((stat) => ({
        label: [...stat.spellings.entries()].sort((a, b) => b[1] - a[1])[0][0],
        key: stat.keyCount > 0,
      }));

  // پیشنهاد برای هر دسته؛ اگر دسته هنوز کالایی ندارد، از نزدیک‌ترین دسته والد
  const specSuggestions: Record<string, SpecSuggestion[]> = {};
  for (const node of nodes.values()) {
    let current: typeof node | undefined = node;
    while (current) {
      const stats = byCategory.get(current.id);
      if (stats && stats.size > 0) {
        specSuggestions[node.id] = toSuggestions(stats);
        break;
      }
      current = current.parentId ? nodes.get(current.parentId) : undefined;
    }
  }

  return {
    categories: flattenTree(roots).map(({ node, depth }) => ({
      id: node.id,
      label: `${"— ".repeat(depth)}${node.name}`,
    })),
    brands: brandRows.map((row) => row.brand).filter((brand): brand is string => Boolean(brand)),
    specSuggestions,
  };
}

import "server-only";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  description: string | null;
  productCount: number;
  children: CategoryNode[];
};

// همه دسته‌ها را یک‌بار می‌خواند و درخت می‌سازد
export const getCategoryTree = cache(async () => {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: { products: { where: { isActive: true } } },
      },
    },
  });

  const nodes = new Map<string, CategoryNode>(
    categories.map((category) => [
      category.id,
      {
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        sortOrder: category.sortOrder,
        description: category.description,
        productCount: category._count.products,
        children: [],
      },
    ]),
  );

  const roots: CategoryNode[] = [];

  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // تعداد کالای هر دسته شامل زیرمجموعه‌ها
  const totalCount = (node: CategoryNode): number =>
    node.productCount +
    node.children.reduce((sum, child) => sum + totalCount(child), 0);

  const totals = new Map<string, number>();
  for (const node of nodes.values()) {
    totals.set(node.id, totalCount(node));
  }

  return { roots, nodes, totals };
});

export function getDescendantIds(node: CategoryNode): string[] {
  return [node.id, ...node.children.flatMap(getDescendantIds)];
}

export function getAncestors(
  node: CategoryNode,
  nodes: Map<string, CategoryNode>,
): CategoryNode[] {
  const chain: CategoryNode[] = [];
  let current = node.parentId ? nodes.get(node.parentId) : undefined;
  const seen = new Set<string>();

  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.unshift(current);
    current = current.parentId ? nodes.get(current.parentId) : undefined;
  }

  return chain;
}

// برای سلکت‌های پنل مدیریت: «موبایل › گوشی › سامسونگ»
export function flattenTree(
  roots: CategoryNode[],
  depth = 0,
): { node: CategoryNode; depth: number }[] {
  return roots.flatMap((node) => [
    { node, depth },
    ...flattenTree(node.children, depth + 1),
  ]);
}

import "server-only";
import { flattenTree, getCategoryTree } from "@/lib/categories";
import { prisma } from "@/lib/prisma";

export async function getEditorOptions() {
  const [{ roots }, brandRows] = await Promise.all([
    getCategoryTree(),
    prisma.product.findMany({
      where: { brand: { not: null } },
      distinct: ["brand"],
      select: { brand: true },
    }),
  ]);

  return {
    categories: flattenTree(roots).map(({ node, depth }) => ({
      id: node.id,
      label: `${"— ".repeat(depth)}${node.name}`,
    })),
    brands: brandRows.map((row) => row.brand).filter((brand): brand is string => Boolean(brand)),
  };
}

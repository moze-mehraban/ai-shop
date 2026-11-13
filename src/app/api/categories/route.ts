import { getCategoryTree, type CategoryNode } from "@/lib/categories";

export const dynamic = "force-dynamic";

type HeaderCategory = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  children: HeaderCategory[];
};

export async function GET() {
  const { roots, totals } = await getCategoryTree();

  const toJson = (node: CategoryNode): HeaderCategory => ({
    id: node.id,
    name: node.name,
    slug: node.slug,
    productCount: totals.get(node.id) ?? 0,
    children: node.children.map(toJson),
  });

  return Response.json(roots.map(toJson));
}

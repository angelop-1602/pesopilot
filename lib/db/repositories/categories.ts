import type { Category, CategoryKind } from "@/types/finance"
import { createId, getDb, nowIso } from "@/lib/db/client"

export async function listCategories(kind?: CategoryKind) {
  const db = getDb()
  const categories = await db.categories.toArray()

  return kind
    ? categories.filter((category) => category.kind === kind)
    : categories
}

export async function createCategory(
  values: Pick<Category, "name" | "kind" | "color">
) {
  const db = getDb()
  const now = nowIso()
  const category: Category = {
    id: createId(),
    name: values.name.trim(),
    kind: values.kind,
    color: values.color,
    system: false,
    createdAt: now,
    updatedAt: now,
  }

  await db.categories.add(category)
  return category
}

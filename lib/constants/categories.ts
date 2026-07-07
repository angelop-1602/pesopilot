import type { Category } from "@/types/finance"

const now = "2026-01-01T00:00:00.000Z"

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "income-salary",
    name: "Salary",
    kind: "income",
    color: "var(--chart-2)",
    system: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "income-side-hustle",
    name: "Side hustle",
    kind: "income",
    color: "var(--chart-3)",
    system: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "expense-food",
    name: "Food",
    kind: "expense",
    color: "var(--chart-1)",
    system: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "expense-transport",
    name: "Transport",
    kind: "expense",
    color: "var(--chart-2)",
    system: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "expense-bills",
    name: "Bills",
    kind: "expense",
    color: "var(--chart-3)",
    system: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "expense-groceries",
    name: "Groceries",
    kind: "expense",
    color: "var(--chart-4)",
    system: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "expense-savings",
    name: "Savings",
    kind: "expense",
    color: "var(--chart-5)",
    system: true,
    createdAt: now,
    updatedAt: now,
  },
]

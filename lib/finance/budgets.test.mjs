import assert from "node:assert/strict"
import { test } from "node:test"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, { tsconfigPaths: true })
const { backupSchema } = jiti("../backup/schema.ts")
const { getBudgetSpend } = jiti("./budget-spending.ts")
const {
  BUDGET_NAME_MAX_LENGTH,
  assertBudgetCategoryAvailable,
  getBudgetDisplayName,
  normalizeBudgetName,
} = jiti("./budgets.ts")

const timestamp = "2026-08-15T00:00:00.000Z"

function makeBudget(overrides = {}) {
  return {
    id: "budget-1",
    monthId: "2026-08",
    categoryId: "category-1",
    limitCentavos: 50_000,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  }
}

function makeBackup(budgets) {
  return {
    schemaVersion: 1,
    exportedAt: timestamp,
    app: "PesoPilot",
    data: {
      accounts: [],
      categories: [],
      transactions: [],
      budgets,
      goals: [],
      bills: [],
      settings: [],
    },
  }
}

test("budget names are trimmed and validated", () => {
  assert.equal(normalizeBudgetName("  Weekly groceries  "), "Weekly groceries")
  assert.throws(() => normalizeBudgetName("   "), /Budget name is required/)
  assert.throws(
    () => normalizeBudgetName("x".repeat(BUDGET_NAME_MAX_LENGTH + 1)),
    /80 characters or fewer/
  )
})

test("legacy budgets fall back to their category name", () => {
  assert.equal(getBudgetDisplayName(makeBudget(), "Food"), "Food")
  assert.equal(
    getBudgetDisplayName(makeBudget({ name: "  Weekly groceries  " }), "Food"),
    "Weekly groceries"
  )
  assert.equal(getBudgetDisplayName(makeBudget(), ""), "Untitled budget")
})

test("a month cannot contain two budgets for the same category", () => {
  assert.doesNotThrow(() => assertBudgetCategoryAvailable("budget-1", "budget-1"))
  assert.doesNotThrow(() => assertBudgetCategoryAvailable("budget-1"))
  assert.throws(
    () => assertBudgetCategoryAvailable("budget-1", "budget-2"),
    /already has a budget/
  )
  assert.throws(
    () => assertBudgetCategoryAvailable(undefined, "budget-2"),
    /already has a budget/
  )
})

test("budget names do not change category-based spending", () => {
  const [budget] = getBudgetSpend(
    [makeBudget({ name: "Weekly groceries" })],
    [
      {
        id: "transaction-1",
        type: "expense",
        amountCentavos: 12_500,
        accountId: "account-1",
        categoryId: "category-1",
        date: "2026-08-10",
        description: "Groceries",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    "2026-08"
  )

  assert.equal(budget.name, "Weekly groceries")
  assert.equal(budget.spentCentavos, 12_500)
  assert.equal(budget.remainingCentavos, 37_500)
})

test("version-1 backups retain names and accept legacy unnamed budgets", () => {
  const named = backupSchema.parse(
    makeBackup([makeBudget({ name: "  Weekly groceries  " })])
  )
  const legacy = backupSchema.parse(makeBackup([makeBudget()]))

  assert.equal(named.data.budgets[0].name, "Weekly groceries")
  assert.equal(legacy.data.budgets[0].name, undefined)
  assert.throws(() =>
    backupSchema.parse(makeBackup([makeBudget({ name: "   " })]))
  )
})

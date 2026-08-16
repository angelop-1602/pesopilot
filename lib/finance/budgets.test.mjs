import assert from "node:assert/strict"
import { test } from "node:test"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, { tsconfigPaths: true })
const { backupSchema } = jiti("../backup/schema.ts")
const { getBudgetSpend, resolveExpenseBudgetId } = jiti(
  "./budget-spending.ts"
)
const {
  BUDGET_NAME_MAX_LENGTH,
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

function makeTransaction(overrides = {}) {
  return {
    id: "transaction-1",
    type: "expense",
    amountCentavos: 12_500,
    accountId: "account-1",
    categoryId: "category-1",
    date: "2026-08-10",
    description: "Groceries",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  }
}

function makeBackup(budgets, transactions = []) {
  return {
    schemaVersion: 1,
    exportedAt: timestamp,
    app: "PesoPilot",
    data: {
      accounts: [],
      categories: [],
      transactions,
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

test("budget names do not change category-based spending", () => {
  const [budget] = getBudgetSpend(
    [makeBudget({ name: "Weekly groceries" })],
    [makeTransaction()],
    "2026-08"
  )

  assert.equal(budget.name, "Weekly groceries")
  assert.equal(budget.spentCentavos, 12_500)
  assert.equal(budget.remainingCentavos, 37_500)
})

test("multiple named budgets can reuse a category without double-counting", () => {
  const olderBudget = makeBudget({
    id: "budget-older",
    name: "Weekly groceries",
    createdAt: "2026-08-01T00:00:00.000Z",
  })
  const newerBudget = makeBudget({
    id: "budget-newer",
    name: "Pantry restock",
    createdAt: "2026-08-02T00:00:00.000Z",
  })
  const transactions = [
    makeTransaction({
      id: "legacy-card-expense",
      accountId: "credit-card-account",
      amountCentavos: 12_500,
    }),
    makeTransaction({
      id: "allocated-card-expense",
      accountId: "another-credit-card-account",
      budgetId: "budget-newer",
      amountCentavos: 7_500,
    }),
  ]

  const spending = getBudgetSpend(
    // Deliberately reverse the creation order to prove fallback is deterministic.
    [newerBudget, olderBudget],
    transactions,
    "2026-08"
  )
  const spentById = Object.fromEntries(
    spending.map((budget) => [budget.id, budget.spentCentavos])
  )

  assert.deepEqual(spentById, {
    "budget-newer": 7_500,
    "budget-older": 12_500,
  })
  assert.equal(
    spending.reduce((total, budget) => total + budget.spentCentavos, 0),
    20_000
  )
})

test("legacy category allocation uses the id as a stable age tie-breaker", () => {
  const transaction = makeTransaction()
  const budgets = [
    makeBudget({ id: "budget-z" }),
    makeBudget({ id: "budget-a" }),
  ]

  assert.equal(
    resolveExpenseBudgetId(budgets, transaction, "2026-08"),
    "budget-a"
  )
})

test("an explicit budget link never falls back to another category budget", () => {
  const budgets = [
    makeBudget({ id: "budget-1" }),
    makeBudget({ id: "budget-2" }),
  ]
  const transaction = makeTransaction({ budgetId: "deleted-budget" })

  assert.equal(resolveExpenseBudgetId(budgets, transaction, "2026-08"), undefined)
  assert.deepEqual(
    getBudgetSpend(budgets, [transaction], "2026-08").map(
      (budget) => budget.spentCentavos
    ),
    [0, 0]
  )
})

test("card payments and out-of-month expenses do not reduce budgets", () => {
  const budget = makeBudget()
  const transactions = [
    makeTransaction({
      id: "card-payment",
      type: "transfer",
      categoryId: undefined,
      accountId: "bank-account",
      transferAccountId: "credit-card-account",
    }),
    makeTransaction({
      id: "older-card-expense",
      accountId: "credit-card-account",
      date: "2026-07-31",
    }),
  ]

  assert.equal(
    getBudgetSpend([budget], transactions, "2026-08")[0].spentCentavos,
    0
  )
})

test("version-1 backups retain optional budget links and legacy records", () => {
  const named = backupSchema.parse(
    makeBackup(
      [makeBudget({ name: "  Weekly groceries  " })],
      [makeTransaction({ budgetId: "budget-1" })]
    )
  )
  const legacy = backupSchema.parse(
    makeBackup([makeBudget()], [makeTransaction()])
  )

  assert.equal(named.data.budgets[0].name, "Weekly groceries")
  assert.equal(named.data.transactions[0].budgetId, "budget-1")
  assert.equal(legacy.data.budgets[0].name, undefined)
  assert.equal(legacy.data.transactions[0].budgetId, undefined)
  assert.throws(() =>
    backupSchema.parse(makeBackup([makeBudget({ name: "   " })]))
  )
})

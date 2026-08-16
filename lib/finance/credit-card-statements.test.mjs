import assert from "node:assert/strict"
import { test } from "node:test"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, { tsconfigPaths: true })
const {
  getCreditCardAccounts,
  getCreditCardDueDate,
  getCreditCardStatementStatus,
  getCreditCardStatementSummaries,
  getCreditCardStatementSummary,
  getCreditUtilization,
  getRemainingStatementBalance,
  getStatementPaymentTotal,
  getStatementPaymentTransactions,
} = jiti("./credit-card-statements.ts")

const timestamp = "2026-08-01T00:00:00.000Z"

function makeAccount(overrides = {}) {
  return {
    id: "card-1",
    name: "Primary Card",
    type: "credit",
    institutionKey: "other",
    institutionName: "Other",
    institutionCategory: "other",
    accountProductType: "credit_card",
    balanceNature: "liability",
    displayName: "Primary Card",
    openingBalanceCentavos: 0,
    balanceCentavos: 400_000,
    currency: "PHP",
    includeInNetWorth: true,
    creditLimitCentavos: 500_000,
    statementDay: 15,
    paymentDueDay: 25,
    lastStatementDate: "2026-08-15",
    currentStatementBalanceCentavos: 300_000,
    availableCreditCentavos: 100_000,
    archived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  }
}

function makeTransaction(overrides = {}) {
  return {
    id: "payment-1",
    type: "transfer",
    amountCentavos: 100_000,
    accountId: "bank-1",
    transferAccountId: "card-1",
    date: "2026-08-15",
    description: "Card payment",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  }
}

test("credit card derivation includes legacy cards and excludes archived cards", () => {
  const productCard = makeAccount()
  const legacyCard = makeAccount({
    id: "legacy-card",
    accountProductType: undefined,
    type: "credit",
  })
  const archivedCard = makeAccount({ id: "archived-card", archived: true })
  const asset = makeAccount({
    id: "bank-1",
    accountProductType: "savings",
    type: "bank",
    balanceNature: "asset",
  })

  assert.deepEqual(
    getCreditCardAccounts([productCard, legacyCard, archivedCard, asset]).map(
      (account) => account.id
    ),
    ["card-1", "legacy-card"]
  )
})

test("utilization is derived from the current balance and credit limit", () => {
  assert.equal(
    getCreditUtilization({
      balanceCentavos: 125_000,
      creditLimitCentavos: 500_000,
    }),
    25
  )
  assert.equal(
    getCreditUtilization({
      balanceCentavos: 625_000,
      creditLimitCentavos: 500_000,
    }),
    125
  )
  assert.equal(
    getCreditUtilization({
      balanceCentavos: -25_000,
      creditLimitCentavos: 500_000,
    }),
    0
  )
  assert.equal(
    getCreditUtilization({
      balanceCentavos: 10_000,
      creditLimitCentavos: undefined,
    }),
    undefined
  )
  assert.equal(
    getCreditUtilization({
      balanceCentavos: 10_000,
      creditLimitCentavos: 0,
    }),
    undefined
  )
})

test("due dates use the first configured due day after the statement date", () => {
  assert.equal(getCreditCardDueDate("2026-08-15", 25), "2026-08-25")
  assert.equal(getCreditCardDueDate("2026-08-25", 5), "2026-09-05")
  assert.equal(getCreditCardDueDate("2026-08-15", 15), "2026-09-15")
})

test("due dates clamp to month end after rollover, including leap years", () => {
  assert.equal(getCreditCardDueDate("2026-01-31", 31), "2026-02-28")
  assert.equal(getCreditCardDueDate("2024-01-31", 31), "2024-02-29")
  assert.equal(getCreditCardDueDate("2024-02-29", 31), "2024-03-31")
  assert.equal(getCreditCardDueDate("2026-04-30", 31), "2026-05-31")
  assert.equal(getCreditCardDueDate("not-a-date", 25), undefined)
  assert.equal(getCreditCardDueDate("2026-08-15", 32), undefined)
})

test("statement payments are incoming card transfers on or after statement close", () => {
  const transactions = [
    makeTransaction({ id: "on-close" }),
    makeTransaction({
      id: "after-close",
      amountCentavos: 50_000,
      date: "2026-08-19T10:00:00.000Z",
    }),
    makeTransaction({ id: "before-close", date: "2026-08-14" }),
    makeTransaction({ id: "future", date: "2026-08-21" }),
    makeTransaction({
      id: "other-card",
      transferAccountId: "card-2",
    }),
    makeTransaction({
      id: "outgoing",
      accountId: "card-1",
      transferAccountId: "bank-1",
    }),
    makeTransaction({
      id: "purchase",
      type: "expense",
      accountId: "card-1",
    }),
  ]

  assert.deepEqual(
    getStatementPaymentTransactions(
      transactions,
      "card-1",
      "2026-08-15",
      "2026-08-20"
    ).map((transaction) => transaction.id),
    ["on-close", "after-close"]
  )
  assert.equal(
    getStatementPaymentTotal(
      transactions,
      "card-1",
      "2026-08-15",
      "2026-08-20"
    ),
    150_000
  )
})

test("remaining statement balances never become negative", () => {
  assert.equal(getRemainingStatementBalance(300_000, 125_000), 175_000)
  assert.equal(getRemainingStatementBalance(300_000, 300_000), 0)
  assert.equal(getRemainingStatementBalance(300_000, 350_000), 0)
})

test("statement status covers pending, due-soon, due-today, overdue, and paid", () => {
  const base = {
    dueDate: "2026-08-25",
    hasStatement: true,
    remainingStatementBalanceCentavos: 100_000,
  }

  assert.equal(
    getCreditCardStatementStatus({ ...base, asOfDate: "2026-08-17" }),
    "pending"
  )
  assert.equal(
    getCreditCardStatementStatus({ ...base, asOfDate: "2026-08-18" }),
    "due-soon"
  )
  assert.equal(
    getCreditCardStatementStatus({ ...base, asOfDate: "2026-08-25" }),
    "due-today"
  )
  assert.equal(
    getCreditCardStatementStatus({ ...base, asOfDate: "2026-08-26" }),
    "overdue"
  )
  assert.equal(
    getCreditCardStatementStatus({
      ...base,
      asOfDate: "2026-09-01",
      remainingStatementBalanceCentavos: 0,
    }),
    "paid"
  )
  assert.equal(
    getCreditCardStatementStatus({
      ...base,
      asOfDate: "2026-08-20",
      dueSoonDays: 4,
    }),
    "pending"
  )
  assert.equal(
    getCreditCardStatementStatus({
      ...base,
      asOfDate: "2026-08-20",
      dueSoonDays: 5,
    }),
    "due-soon"
  )
})

test("no statement and missing due configuration have explicit statuses", () => {
  assert.equal(
    getCreditCardStatementStatus({
      asOfDate: "2026-08-20",
      hasStatement: false,
      remainingStatementBalanceCentavos: 0,
    }),
    "no-statement"
  )
  assert.equal(
    getCreditCardStatementStatus({
      asOfDate: "2026-08-20",
      hasStatement: true,
      remainingStatementBalanceCentavos: 100_000,
    }),
    "pending"
  )
})

test("summaries expose utilization, due state, and statement payment progress", () => {
  const transactions = [
    makeTransaction(),
    makeTransaction({
      id: "second-payment",
      amountCentavos: 20_000,
      date: "2026-08-19",
    }),
    makeTransaction({
      id: "future-payment",
      amountCentavos: 200_000,
      date: "2026-08-21",
    }),
  ]
  const summary = getCreditCardStatementSummary(
    makeAccount(),
    transactions,
    { asOfDate: "2026-08-20" }
  )

  assert.equal(summary.currentBalanceCentavos, 400_000)
  assert.equal(summary.creditLimitCentavos, 500_000)
  assert.equal(summary.availableCreditCentavos, 100_000)
  assert.equal(summary.utilizationPercent, 80)
  assert.equal(summary.isOverLimit, false)
  assert.equal(summary.dueDate, "2026-08-25")
  assert.equal(summary.statementBalanceCentavos, 300_000)
  assert.equal(summary.paidTowardStatementCentavos, 120_000)
  assert.equal(summary.remainingStatementBalanceCentavos, 180_000)
  assert.equal(summary.status, "due-soon")
  assert.equal(summary.canPay, true)
})

test("fully paid statements stop offering payment while new cards report no statement", () => {
  const paid = getCreditCardStatementSummary(
    makeAccount(),
    [makeTransaction({ amountCentavos: 350_000 })],
    { asOfDate: "2026-08-20" }
  )
  const newCard = getCreditCardStatementSummary(
    makeAccount({
      id: "new-card",
      lastStatementDate: undefined,
      currentStatementBalanceCentavos: undefined,
    }),
    [],
    { asOfDate: "2026-08-20" }
  )

  assert.equal(paid.remainingStatementBalanceCentavos, 0)
  assert.equal(paid.status, "paid")
  assert.equal(paid.canPay, false)
  assert.equal(newCard.status, "no-statement")
  assert.equal(newCard.canPay, false)
  assert.equal(newCard.dueDate, undefined)
})

test("aggregate summaries are deterministic at the requested as-of date", () => {
  const summaries = getCreditCardStatementSummaries(
    [
      makeAccount(),
      makeAccount({ id: "archived", archived: true }),
      makeAccount({
        id: "cash",
        accountProductType: "cash",
        type: "cash",
        balanceNature: "asset",
      }),
    ],
    [],
    { asOfDate: "2026-08-26" }
  )

  assert.equal(summaries.length, 1)
  assert.equal(summaries[0].account.id, "card-1")
  assert.equal(summaries[0].status, "overdue")
  assert.throws(
    () =>
      getCreditCardStatementSummaries([makeAccount()], [], {
        asOfDate: "invalid",
      }),
    /As-of date must be a valid input date/
  )
})

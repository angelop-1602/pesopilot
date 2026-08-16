import assert from "node:assert/strict"
import { test } from "node:test"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, { tsconfigPaths: true })
const {
  getStatementDateForCycle,
  maybeCloseCreditCardStatement,
  replayAccountBalanceBeforeDate,
} = jiti("./accounts.ts")
const { getCreditCardStatementSummary } = jiti(
  "./credit-card-statements.ts"
)

const timestamp = "2026-07-01T00:00:00.000Z"

function makeCard(overrides = {}) {
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
    openingBalanceCentavos: 100_000,
    balanceCentavos: 999_999,
    currency: "PHP",
    includeInNetWorth: true,
    creditLimitCentavos: 1_000_000,
    statementDay: 15,
    paymentDueDay: 25,
    availableCreditCentavos: 1,
    archived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  }
}

function makeTransaction(overrides = {}) {
  return {
    id: "purchase-1",
    type: "expense",
    amountCentavos: 50_000,
    accountId: "card-1",
    categoryId: "category-1",
    date: "2026-08-10",
    description: "Purchase",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  }
}

test("the latest elapsed statement cycle is found after a missed app open", () => {
  assert.equal(getStatementDateForCycle("2026-09-10", 15), "2026-08-15")
  assert.equal(getStatementDateForCycle("2026-09-15", 15), "2026-09-15")
  assert.equal(getStatementDateForCycle("2026-03-01", 31), "2026-02-28")
  assert.equal(getStatementDateForCycle("2024-03-01", 31), "2024-02-29")
})

test("statement close replays opening balance through the exclusive cutoff", () => {
  const card = makeCard()
  const transactions = [
    makeTransaction(),
    makeTransaction({
      id: "post-close",
      amountCentavos: 70_000,
      date: "2026-08-16",
    }),
    makeTransaction({
      id: "future",
      amountCentavos: 80_000,
      date: "2026-10-01",
    }),
  ]
  const closed = maybeCloseCreditCardStatement(
    card,
    transactions,
    "2026-09-10"
  )

  assert.ok(closed)
  assert.equal(closed.lastStatementDate, "2026-08-15")
  assert.equal(closed.currentStatementBalanceCentavos, 150_000)
  assert.equal(card.balanceCentavos, 999_999)
})

test("rerunning maintenance refreshes the same cycle after a backdated purchase", () => {
  const firstClose = maybeCloseCreditCardStatement(
    makeCard(),
    [makeTransaction()],
    "2026-08-20"
  )

  assert.ok(firstClose)
  assert.equal(firstClose.currentStatementBalanceCentavos, 150_000)
  assert.equal(
    maybeCloseCreditCardStatement(
      firstClose,
      [makeTransaction()],
      "2026-08-20"
    ),
    null
  )

  const refreshed = maybeCloseCreditCardStatement(
    firstClose,
    [
      makeTransaction(),
      makeTransaction({
        id: "backdated",
        amountCentavos: 25_000,
        date: "2026-08-12",
      }),
    ],
    "2026-08-20"
  )

  assert.ok(refreshed)
  assert.equal(refreshed.lastStatementDate, "2026-08-15")
  assert.equal(refreshed.currentStatementBalanceCentavos, 175_000)
})

test("close-date transfers are payments and are not deducted twice", () => {
  const card = makeCard({
    openingBalanceCentavos: 400_000,
    balanceCentavos: 325_000,
  })
  const transactions = [
    makeTransaction({ amountCentavos: 100_000 }),
    makeTransaction({
      id: "payment-before-close",
      type: "transfer",
      accountId: "bank-1",
      transferAccountId: "card-1",
      amountCentavos: 50_000,
      date: "2026-08-14",
    }),
    makeTransaction({
      id: "payment-on-close",
      type: "transfer",
      accountId: "bank-1",
      transferAccountId: "card-1",
      amountCentavos: 200_000,
      date: "2026-08-15",
    }),
    makeTransaction({
      id: "purchase-on-close",
      amountCentavos: 75_000,
      date: "2026-08-15",
    }),
  ]

  assert.equal(
    replayAccountBalanceBeforeDate(card, transactions, "2026-08-15"),
    450_000
  )

  const closed = maybeCloseCreditCardStatement(
    card,
    transactions,
    "2026-08-15"
  )
  assert.ok(closed)

  const summary = getCreditCardStatementSummary(closed, transactions, {
    asOfDate: "2026-08-16",
  })

  assert.equal(summary.statementBalanceCentavos, 450_000)
  assert.equal(summary.paidTowardStatementCentavos, 200_000)
  assert.equal(summary.remainingStatementBalanceCentavos, 250_000)
})

test("an account is not assigned a statement cycle from before it existed", () => {
  const newCard = makeCard({ createdAt: "2026-08-20T00:00:00.000Z" })

  assert.equal(
    maybeCloseCreditCardStatement(newCard, [], "2026-09-10"),
    null
  )
})

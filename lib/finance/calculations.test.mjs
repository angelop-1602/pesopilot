import assert from "node:assert/strict"
import { test } from "node:test"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, { tsconfigPaths: true })
const {
  getBillOccurrenceDatesForMonth,
  getBillOccurrencesForMonth,
  getPendingCommitments,
  getSafeToSpend,
  getUpcomingBills,
} = jiti("./calculations.ts")
const { replayAccountBalances } = jiti("./account-balance-replay.ts")

const timestamp = "2026-01-01T00:00:00.000Z"

function makeBill(overrides = {}) {
  return {
    id: "bill-1",
    name: "Internet",
    amountCentavos: 150_000,
    dueDay: 15,
    frequency: "monthly",
    autopay: false,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  }
}

function makeTransaction(overrides = {}) {
  return {
    id: "transaction-1",
    type: "expense",
    amountCentavos: 150_000,
    accountId: "asset-1",
    billId: "bill-1",
    date: "2026-08-15",
    description: "Internet payment",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  }
}

function makeAccount(overrides = {}) {
  return {
    id: "asset-1",
    name: "Cash Wallet",
    institutionKey: "cash",
    institutionName: "Cash",
    institutionCategory: "cash",
    accountProductType: "cash",
    balanceNature: "asset",
    displayName: "Cash Wallet",
    openingBalanceCentavos: 1_000_000,
    balanceCentavos: 1_000_000,
    currency: "PHP",
    includeInNetWorth: true,
    archived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  }
}

test("monthly occurrences clamp month-end dates and use linked expenses", () => {
  const bill = makeBill({
    amountCentavos: 200_000,
    dueDay: 31,
    firstDueDate: "2024-01-31",
  })
  const wrongMonth = makeTransaction({ date: "2024-01-31" })
  const wrongType = makeTransaction({ id: "income", type: "income" })

  assert.deepEqual(getBillOccurrenceDatesForMonth(bill, "2024-02"), [
    "2024-02-29",
  ])
  assert.equal(
    getBillOccurrencesForMonth(
      [bill],
      [wrongMonth, wrongType],
      "2024-02",
      "2024-02-29"
    )[0].status,
    "pending"
  )

  const paid = getBillOccurrencesForMonth(
    [bill],
    [
      makeTransaction({
        amountCentavos: 190_000,
        billOccurrenceDate: "2024-02-29",
        date: "2024-02-20",
      }),
    ],
    "2024-02",
    "2024-03-01"
  )[0]

  assert.equal(paid.status, "paid")
  assert.equal(paid.paidAmountCentavos, 190_000)
  assert.equal(paid.expectedAmountCentavos, 200_000)
})

test("explicit bill occurrence links recognize early and late cross-month payments", () => {
  const bill = makeBill({
    dueDay: 31,
    firstDueDate: "2026-08-31",
  })
  const earlyPayment = makeTransaction({
    id: "early",
    billOccurrenceDate: "2026-08-31",
    date: "2026-07-30",
  })
  const latePayment = makeTransaction({
    id: "late",
    billOccurrenceDate: "2026-08-31",
    date: "2026-09-02",
  })

  for (const payment of [earlyPayment, latePayment]) {
    const [occurrence] = getBillOccurrencesForMonth(
      [bill],
      [payment],
      "2026-08",
      "2026-09-03"
    )

    assert.equal(occurrence.status, "paid")
    assert.deepEqual(occurrence.paymentTransactionIds, [payment.id])
  }
})

test("weekly schedules create every occurrence and assign payments one-to-one", () => {
  const bill = makeBill({
    frequency: "weekly",
    firstDueDate: "2026-08-03",
  })
  const transactions = [
    makeTransaction({ id: "first", date: "2026-08-04" }),
    makeTransaction({
      id: "third",
      billOccurrenceDate: "2026-08-17",
      date: "2026-08-16",
    }),
    makeTransaction({ id: "fourth", date: "2026-08-25" }),
  ]
  const occurrences = getBillOccurrencesForMonth(
    [bill],
    transactions,
    "2026-08",
    "2026-08-20"
  )

  assert.deepEqual(
    occurrences.map((occurrence) => occurrence.dueDate),
    [
      "2026-08-03",
      "2026-08-10",
      "2026-08-17",
      "2026-08-24",
      "2026-08-31",
    ]
  )
  assert.deepEqual(
    occurrences.map((occurrence) => occurrence.status),
    ["paid", "overdue", "paid", "paid", "pending"]
  )
  assert.deepEqual(occurrences[0].paymentTransactionIds, ["first"])
  assert.deepEqual(occurrences[2].paymentTransactionIds, ["third"])
  assert.deepEqual(occurrences[3].paymentTransactionIds, ["fourth"])
  assert.equal(getUpcomingBills([bill], "2026-08").length, 5)
})

test("yearly schedules appear only in their anchored month", () => {
  const bill = makeBill({
    frequency: "yearly",
    firstDueDate: "2026-09-30",
  })

  assert.deepEqual(getBillOccurrenceDatesForMonth(bill, "2026-08"), [])
  assert.deepEqual(getBillOccurrenceDatesForMonth(bill, "2025-09"), [])
  assert.deepEqual(getBillOccurrenceDatesForMonth(bill, "2027-09"), [
    "2027-09-30",
  ])
})

test("inactive bills are excluded while unassigned bills remain commitments", () => {
  const active = makeBill({ accountId: undefined, categoryId: undefined })
  const inactive = makeBill({ id: "bill-2", active: false })
  const commitments = getPendingCommitments(
    [active, inactive],
    [],
    "2026-08",
    "2026-08-20"
  )

  assert.equal(commitments.items.length, 1)
  assert.equal(commitments.items[0].status, "overdue")
  assert.equal(commitments.totalCentavos, active.amountCentavos)
})

test("paid occurrences leave pending and overdue items out of commitments", () => {
  const pendingBill = makeBill({ id: "pending", dueDay: 25 })
  const overdueBill = makeBill({ id: "overdue", dueDay: 5 })
  const paidBill = makeBill({ id: "paid", dueDay: 10 })
  const payment = makeTransaction({ billId: "paid", date: "2026-08-09" })
  const commitments = getPendingCommitments(
    [pendingBill, overdueBill, paidBill],
    [payment],
    "2026-08",
    "2026-08-20"
  )

  assert.deepEqual(
    commitments.items.map((item) => item.billId),
    ["overdue", "pending"]
  )
  assert.equal(commitments.totalCentavos, 300_000)
  assert.equal(
    getPendingCommitments(
      [paidBill],
      [payment],
      "2026-08",
      "2026-08-20"
    ).totalCentavos,
    0
  )
})

test("Safe to Spend excludes liabilities and archived assets and clamps at zero", () => {
  const accounts = [
    makeAccount(),
    makeAccount({
      id: "liability",
      balanceNature: "liability",
      accountProductType: "credit_card",
      balanceCentavos: 300_000,
    }),
    makeAccount({ id: "archived", archived: true, balanceCentavos: 500_000 }),
  ]
  const summary = getSafeToSpend(accounts, 1_200_000)

  assert.deepEqual(summary, {
    availableAssetsCentavos: 1_000_000,
    pendingCommitmentsCentavos: 1_200_000,
    safeToSpendCentavos: 0,
  })
  assert.equal(getSafeToSpend(accounts, 0).safeToSpendCentavos, 1_000_000)
  assert.deepEqual(getSafeToSpend([], 0), {
    availableAssetsCentavos: 0,
    pendingCommitmentsCentavos: 0,
    safeToSpendCentavos: 0,
  })
  assert.equal(getSafeToSpend(accounts, -1).safeToSpendCentavos, 1_000_000)
})

test("account balance replay preserves asset and liability transaction signs", () => {
  const accounts = [
    makeAccount({
      openingBalanceCentavos: 100_000,
      balanceCentavos: 999_999,
    }),
    makeAccount({
      id: "credit-card",
      name: "Credit Card",
      displayName: "Credit Card",
      accountProductType: "credit_card",
      balanceNature: "liability",
      openingBalanceCentavos: 0,
      balanceCentavos: 999_999,
      creditLimitCentavos: 500_000,
    }),
  ]
  const transactions = [
    makeTransaction({ id: "asset-expense", amountCentavos: 10_000 }),
    makeTransaction({
      id: "asset-income",
      type: "income",
      amountCentavos: 20_000,
    }),
    makeTransaction({
      id: "credit-payment",
      type: "transfer",
      amountCentavos: 30_000,
      transferAccountId: "credit-card",
    }),
    makeTransaction({
      id: "credit-expense",
      accountId: "credit-card",
      amountCentavos: 50_000,
    }),
    makeTransaction({
      id: "credit-income",
      type: "income",
      accountId: "credit-card",
      amountCentavos: 10_000,
    }),
    makeTransaction({
      id: "cash-advance",
      type: "transfer",
      accountId: "credit-card",
      transferAccountId: "asset-1",
      amountCentavos: 20_000,
    }),
  ]

  assert.deepEqual(replayAccountBalances(accounts, transactions), [
    {
      accountId: "asset-1",
      balanceCentavos: 100_000,
      availableCreditCentavos: undefined,
    },
    {
      accountId: "credit-card",
      balanceCentavos: 30_000,
      availableCreditCentavos: 470_000,
    },
  ])
})

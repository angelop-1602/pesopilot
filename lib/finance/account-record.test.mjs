import assert from "node:assert/strict"
import { test } from "node:test"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, { tsconfigPaths: true })
const { normalizeStoredAccount } = jiti("./account-normalization.ts")
const { buildAccountRecord } = jiti("./account-record.ts")

const timestamp = "2026-08-15T00:00:00.000Z"

function makeCashAccount(overrides = {}) {
  return {
    id: "account-1",
    name: "Cash Wallet",
    type: "cash",
    institutionKey: "cash",
    institutionName: "Cash",
    institutionCategory: "cash",
    accountProductType: "cash",
    balanceNature: "asset",
    displayName: "Cash Wallet",
    openingBalanceCentavos: 100_000,
    balanceCentavos: 100_000,
    currency: "PHP",
    includeInNetWorth: true,
    archived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  }
}

test("account edits adjust the opening balance without discarding transaction history", () => {
  const existing = makeCashAccount({ balanceCentavos: 125_000 })
  const account = buildAccountRecord({
    existing,
    id: existing.id,
    now: "2026-08-15T01:00:00.000Z",
    input: {
      institutionKey: "cash",
      accountProductType: "cash",
      currentBalanceCentavos: 150_000,
      includeInNetWorth: true,
    },
  })

  assert.equal(account.openingBalanceCentavos, 125_000)
  assert.equal(account.balanceCentavos, 125_000)
  assert.equal(account.createdAt, timestamp)
})

test("credit cards require valid cycle fields and explicit over-limit approval", () => {
  const options = {
    id: "credit-1",
    now: timestamp,
    input: {
      institutionKey: "other",
      accountProductType: "credit_card",
      currentBalanceCentavos: 150_000,
      creditLimitCentavos: 100_000,
      statementDay: 15,
      paymentDueDay: 25,
      includeInNetWorth: true,
    },
  }

  assert.throws(
    () => buildAccountRecord(options),
    /Confirm before saving a credit card over its limit/
  )

  const account = buildAccountRecord({
    ...options,
    input: { ...options.input, allowOverLimit: true },
  })

  assert.equal(account.balanceNature, "liability")
  assert.equal(account.availableCreditCentavos, -50_000)
})

test("legacy accounts normalize to the product model without changing balances", () => {
  const legacy = {
    id: "legacy-1",
    name: "GCash",
    type: "ewallet",
    institutionKey: "gcash",
    openingBalanceCentavos: 25_000,
    balanceCentavos: 30_000,
    includeInNetWorth: true,
    archived: false,
    notes: "legacy field",
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  const result = normalizeStoredAccount(
    legacy,
    "2026-08-15T02:00:00.000Z"
  )

  assert.equal(result.changed, true)
  assert.equal(result.account.displayName, "GCash Wallet")
  assert.equal(result.account.accountProductType, "wallet")
  assert.equal(result.account.openingBalanceCentavos, 25_000)
  assert.equal(result.account.balanceCentavos, 30_000)
})

test("already normalized accounts do not receive maintenance-only updates", () => {
  const account = buildAccountRecord({
    id: "account-1",
    now: timestamp,
    input: {
      institutionKey: "cash",
      accountProductType: "cash",
      currentBalanceCentavos: 100_000,
      includeInNetWorth: true,
    },
  })
  const result = normalizeStoredAccount(
    account,
    "2026-08-15T02:00:00.000Z"
  )

  assert.equal(result.changed, false)
  assert.equal(result.account.updatedAt, timestamp)
})

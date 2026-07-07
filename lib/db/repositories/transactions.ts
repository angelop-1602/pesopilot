import type { Account, Transaction, TransactionFormValues } from "@/types/finance"
import { notifyDataChanged } from "@/lib/db/change-events"
import {
  calculateAvailableCredit,
  getBalanceNature,
  isCreditCardAccount,
} from "@/lib/finance/accounts"
import { pesosToCentavos } from "@/lib/finance/currency"
import { createId, getDb, nowIso } from "@/lib/db/client"

function applyDelta(
  balances: Map<string, number>,
  account: Account | undefined,
  delta: number
) {
  if (!account) {
    return
  }

  balances.set(account.id, (balances.get(account.id) ?? 0) + delta)
}

function applyTransaction(
  balances: Map<string, number>,
  accounts: Map<string, Account>,
  transaction: Transaction
) {
  const account = accounts.get(transaction.accountId)
  const amount = transaction.amountCentavos

  if (!account) {
    return
  }

  if (transaction.type === "income") {
    applyDelta(
      balances,
      account,
      getBalanceNature(account) === "liability" ? -amount : amount
    )
    return
  }

  if (transaction.type === "expense") {
    applyDelta(
      balances,
      account,
      getBalanceNature(account) === "liability" ? amount : -amount
    )
    return
  }

  const transferAccount = transaction.transferAccountId
    ? accounts.get(transaction.transferAccountId)
    : undefined

  if (!transferAccount || transferAccount.id === account.id) {
    return
  }

  applyDelta(
    balances,
    account,
    getBalanceNature(account) === "liability" ? amount : -amount
  )
  applyDelta(
    balances,
    transferAccount,
    getBalanceNature(transferAccount) === "liability" ? -amount : amount
  )
}

export async function recalculateAccountBalances() {
  const db = getDb()
  const [accounts, transactions] = await Promise.all([
    db.accounts.toArray(),
    db.transactions.toArray(),
  ])

  const accountMap = new Map(accounts.map((account) => [account.id, account]))
  const balances = new Map(
    accounts.map((account) => [account.id, account.openingBalanceCentavos])
  )

  transactions.forEach((transaction) => {
    applyTransaction(balances, accountMap, transaction)
  })

  await db.transaction("rw", db.accounts, async () => {
    await Promise.all(
      accounts.map((account) =>
        {
          const balanceCentavos =
            balances.get(account.id) ?? account.balanceCentavos

          return db.accounts.update(account.id, {
            balanceCentavos,
            availableCreditCentavos: isCreditCardAccount(account)
              ? calculateAvailableCredit({
                  ...account,
                  balanceCentavos,
                })
              : undefined,
            updatedAt: nowIso(),
          })
        }
      )
    )
  })
  notifyDataChanged()
}

export async function listTransactions() {
  const db = getDb()
  const transactions = await db.transactions.toArray()

  return transactions.sort((a, b) => b.date.localeCompare(a.date))
}

export async function saveTransaction(values: TransactionFormValues) {
  const db = getDb()
  const now = nowIso()
  const existing = values.id
    ? await db.transactions.get(values.id)
    : undefined

  const transaction: Transaction = {
    id: existing?.id ?? createId(),
    type: values.type,
    amountCentavos: pesosToCentavos(values.amount),
    accountId: values.accountId,
    transferAccountId:
      values.type === "transfer" ? values.transferAccountId : undefined,
    categoryId: values.type === "transfer" ? undefined : values.categoryId,
    billId: values.billId,
    date: values.date,
    description: values.description.trim(),
    notes: values.notes?.trim() || undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  if (transaction.amountCentavos <= 0) {
    throw new Error("Amount must be greater than zero.")
  }

  if (
    transaction.type === "transfer" &&
    (!transaction.transferAccountId ||
      transaction.transferAccountId === transaction.accountId)
  ) {
    throw new Error("Choose a different destination account for transfers.")
  }

  await db.transactions.put(transaction)
  await recalculateAccountBalances()
  notifyDataChanged()
  return transaction
}

export async function deleteTransaction(id: string) {
  const db = getDb()
  await db.transactions.delete(id)
  await recalculateAccountBalances()
  notifyDataChanged()
}

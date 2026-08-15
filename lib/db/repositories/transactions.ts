import type { Transaction } from "@/types/finance"
import { getDb } from "@/lib/db/client"

export async function listTransactions() {
  const transactions = await getDb().transactions.toArray()

  return transactions.sort((a, b) => b.date.localeCompare(a.date))
}

export function getTransaction(id: string) {
  return getDb().transactions.get(id)
}

export function listTransactionsForBill(billId: string) {
  return getDb().transactions.where("billId").equals(billId).toArray()
}

export async function countAccountTransactionReferences(accountId: string) {
  const db = getDb()
  const [accountTransactionCount, transferTransactionCount] =
    await Promise.all([
      db.transactions.where("accountId").equals(accountId).count(),
      db.transactions.where("transferAccountId").equals(accountId).count(),
    ])

  return accountTransactionCount + transferTransactionCount
}

export function putTransaction(transaction: Transaction) {
  return getDb().transactions.put(transaction)
}

export function deleteTransactionRecord(id: string) {
  return getDb().transactions.delete(id)
}

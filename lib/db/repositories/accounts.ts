import type { Account } from "@/types/finance"
import { getDb } from "@/lib/db/client"

interface ListAccountsOptions {
  includeArchived?: boolean
}

export async function listAccounts(options?: ListAccountsOptions) {
  const accounts = await getDb().accounts.toArray()

  return accounts
    .filter((account) => options?.includeArchived || !account.archived)
    .sort((a, b) =>
      (a.displayName ?? a.name).localeCompare(b.displayName ?? b.name)
    )
}

export function getAccount(id: string) {
  return getDb().accounts.get(id)
}

export function putAccount(account: Account) {
  return getDb().accounts.put(account)
}

export function putAccounts(accounts: Account[]) {
  return getDb().accounts.bulkPut(accounts)
}

export function updateAccount(id: string, changes: Partial<Account>) {
  return getDb().accounts.update(id, changes)
}

export function deleteAccountRecord(id: string) {
  return getDb().accounts.delete(id)
}

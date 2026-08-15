import type { Account } from "@/types/finance"
import { getBalanceNature } from "@/lib/finance/accounts"

export function isDebtAccount(account: Partial<Account>) {
  return getBalanceNature(account) === "liability"
}

export function getNetWorth(accounts: readonly Account[]) {
  return accounts.reduce((total, account) => {
    if (account.archived || !account.includeInNetWorth) {
      return total
    }

    return getBalanceNature(account) === "liability"
      ? total - account.balanceCentavos
      : total + account.balanceCentavos
  }, 0)
}

export function getAvailableBalance(accounts: readonly Account[]) {
  return accounts.reduce((total, account) => {
    if (account.archived || isDebtAccount(account)) {
      return total
    }

    return total + account.balanceCentavos
  }, 0)
}

export function getDebtTotal(accounts: readonly Account[]) {
  return accounts.reduce((total, account) => {
    if (account.archived || !isDebtAccount(account)) {
      return total
    }

    return total + account.balanceCentavos
  }, 0)
}

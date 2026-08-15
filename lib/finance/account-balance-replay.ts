import type { Account, Transaction } from "@/types/finance"
import {
  calculateAvailableCredit,
  getBalanceNature,
  isCreditCardAccount,
} from "@/lib/finance/accounts"

export interface AccountBalanceReplayResult {
  accountId: string
  availableCreditCentavos?: number
  balanceCentavos: number
}

function applyBalanceDelta(
  balances: Map<string, number>,
  account: Account | undefined,
  deltaCentavos: number
) {
  if (!account) {
    return
  }

  balances.set(
    account.id,
    (balances.get(account.id) ?? 0) + deltaCentavos
  )
}

function applyTransaction(
  balances: Map<string, number>,
  accounts: ReadonlyMap<string, Account>,
  transaction: Transaction
) {
  const account = accounts.get(transaction.accountId)
  const amountCentavos = transaction.amountCentavos

  if (!account) {
    return
  }

  if (transaction.type === "income") {
    applyBalanceDelta(
      balances,
      account,
      getBalanceNature(account) === "liability"
        ? -amountCentavos
        : amountCentavos
    )
    return
  }

  if (transaction.type === "expense") {
    applyBalanceDelta(
      balances,
      account,
      getBalanceNature(account) === "liability"
        ? amountCentavos
        : -amountCentavos
    )
    return
  }

  const transferAccount = transaction.transferAccountId
    ? accounts.get(transaction.transferAccountId)
    : undefined

  if (!transferAccount || transferAccount.id === account.id) {
    return
  }

  applyBalanceDelta(
    balances,
    account,
    getBalanceNature(account) === "liability"
      ? amountCentavos
      : -amountCentavos
  )
  applyBalanceDelta(
    balances,
    transferAccount,
    getBalanceNature(transferAccount) === "liability"
      ? -amountCentavos
      : amountCentavos
  )
}

export function replayAccountBalances(
  accounts: readonly Account[],
  transactions: readonly Transaction[]
): AccountBalanceReplayResult[] {
  const accountMap = new Map(accounts.map((account) => [account.id, account]))
  const balances = new Map(
    accounts.map((account) => [account.id, account.openingBalanceCentavos])
  )

  for (const transaction of transactions) {
    applyTransaction(balances, accountMap, transaction)
  }

  return accounts.map((account) => {
    const balanceCentavos =
      balances.get(account.id) ?? account.balanceCentavos

    return {
      accountId: account.id,
      balanceCentavos,
      availableCreditCentavos: isCreditCardAccount(account)
        ? calculateAvailableCredit({
            ...account,
            balanceCentavos,
          })
        : undefined,
    }
  })
}

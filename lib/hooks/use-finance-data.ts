"use client"

import { useCallback, useEffect } from "react"

import type {
  Account,
  AppSettings,
  Bill,
  Category,
  MonthlyBudget,
  SavingsGoal,
  Transaction,
} from "@/types/finance"
import { notifyDataChanged } from "@/lib/db/change-events"
import { getDb } from "@/lib/db/client"
import { closeCreditCardStatementsIfNeeded } from "@/lib/db/repositories/accounts"
import { ensureSeedData, createDefaultSettings } from "@/lib/db/seed"
import { useLiveQuery } from "@/lib/hooks/use-live-query"

export interface FinanceSnapshot {
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  budgets: MonthlyBudget[]
  goals: SavingsGoal[]
  bills: Bill[]
  settings: AppSettings
}

const emptySnapshot: FinanceSnapshot = {
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  goals: [],
  bills: [],
  settings: createDefaultSettings(),
}

export function useFinanceData() {
  useEffect(() => {
    const runMaintenance = async () => {
      await ensureSeedData()
      await closeCreditCardStatementsIfNeeded()
      notifyDataChanged()
    }

    void runMaintenance()
  }, [])

  const query = useCallback(async () => {
    const db = getDb()
    const [
      accounts,
      categories,
      transactions,
      budgets,
      goals,
      bills,
      settings,
    ] = await Promise.all([
      db.accounts.toArray(),
      db.categories.toArray(),
      db.transactions.toArray(),
      db.budgets.toArray(),
      db.goals.toArray(),
      db.bills.toArray(),
      db.settings.toArray(),
    ])

    return {
      accounts: accounts
        .filter((account) => !account.archived)
        .sort((a, b) =>
          (a.displayName ?? a.name).localeCompare(b.displayName ?? b.name)
        ),
      categories: categories.sort((a, b) => a.name.localeCompare(b.name)),
      transactions: transactions.sort((a, b) => b.date.localeCompare(a.date)),
      budgets,
      goals: goals.sort((a, b) => a.name.localeCompare(b.name)),
      bills: bills.sort((a, b) => a.dueDay - b.dueDay),
      settings: settings[0] ?? createDefaultSettings(),
    }
  }, [])

  return useLiveQuery<FinanceSnapshot>(query, emptySnapshot)
}

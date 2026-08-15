import type {
  Account,
  AppSettings,
  Bill,
  Category,
  MonthlyBudget,
  SavingsGoal,
  Transaction,
} from "@/types/finance"
import { getDb } from "@/lib/db/client"
import { createDefaultSettings } from "@/lib/db/seed"

export interface FinanceSnapshot {
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  budgets: MonthlyBudget[]
  goals: SavingsGoal[]
  bills: Bill[]
  settings: AppSettings
}

export function createEmptyFinanceSnapshot(): FinanceSnapshot {
  return {
    accounts: [],
    categories: [],
    transactions: [],
    budgets: [],
    goals: [],
    bills: [],
    settings: createDefaultSettings(),
  }
}

export async function getFinanceSnapshot(): Promise<FinanceSnapshot> {
  const db = getDb()
  const [accounts, categories, transactions, budgets, goals, bills, settings] =
    await db.transaction(
      "r",
      [
        db.accounts,
        db.categories,
        db.transactions,
        db.budgets,
        db.goals,
        db.bills,
        db.settings,
      ],
      () =>
        Promise.all([
          db.accounts.toArray(),
          db.categories.toArray(),
          db.transactions.toArray(),
          db.budgets.toArray(),
          db.goals.toArray(),
          db.bills.toArray(),
          db.settings.toArray(),
        ])
    )

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
}

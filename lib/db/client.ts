import Dexie, { type EntityTable } from "dexie"

import type {
  Account,
  AppSettings,
  AutomaticBackupTarget,
  Bill,
  Category,
  MonthlyBudget,
  SavingsGoal,
  Transaction,
} from "@/types/finance"

export class PesoPilotDatabase extends Dexie {
  accounts!: EntityTable<Account, "id">
  categories!: EntityTable<Category, "id">
  transactions!: EntityTable<Transaction, "id">
  budgets!: EntityTable<MonthlyBudget, "id">
  goals!: EntityTable<SavingsGoal, "id">
  bills!: EntityTable<Bill, "id">
  settings!: EntityTable<AppSettings, "id">
  automaticBackups!: EntityTable<AutomaticBackupTarget, "id">

  constructor() {
    super("pesopilot")

    this.version(1).stores({
      accounts: "id, type, archived, createdAt",
      categories: "id, kind, system",
      transactions:
        "id, date, type, accountId, transferAccountId, categoryId, billId",
      budgets: "id, monthId, categoryId, [monthId+categoryId]",
      goals: "id, status, targetDate",
      bills: "id, dueDay, active, categoryId, accountId",
      settings: "id",
    })

    this.version(2).stores({
      accounts:
        "id, type, institutionKey, institutionCategory, accountProductType, balanceNature, archived, createdAt",
      categories: "id, kind, system",
      transactions:
        "id, date, type, accountId, transferAccountId, categoryId, billId",
      budgets: "id, monthId, categoryId, [monthId+categoryId]",
      goals: "id, status, targetDate",
      bills: "id, dueDay, active, categoryId, accountId",
      settings: "id",
    })

    this.version(3).stores({
      accounts:
        "id, type, institutionKey, institutionCategory, accountProductType, balanceNature, archived, createdAt",
      categories: "id, kind, system",
      transactions:
        "id, date, type, accountId, transferAccountId, categoryId, billId",
      budgets: "id, monthId, categoryId, [monthId+categoryId]",
      goals: "id, status, targetDate",
      bills: "id, dueDay, active, categoryId, accountId",
      settings: "id",
      automaticBackups: "id, enabled, updatedAt",
    })
  }
}

let database: PesoPilotDatabase | null = null

export function getDb() {
  if (typeof window === "undefined") {
    throw new Error("PesoPilot IndexedDB is only available in the browser.")
  }

  if (!database) {
    database = new PesoPilotDatabase()
  }

  return database
}

export function createId() {
  return crypto.randomUUID()
}

export function nowIso() {
  return new Date().toISOString()
}

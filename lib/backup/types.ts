import type {
  Account,
  AppSettings,
  BaseRecord,
  Bill,
  Category,
  MonthlyBudget,
  SavingsGoal,
  Transaction,
} from "@/types/finance"

export interface AutomaticBackupTarget extends BaseRecord {
  enabled: boolean
  fileHandle?: unknown
  encryptionPassword?: string
  lastBackupAt?: string
  lastError?: string
}

export interface FinanceBackup {
  schemaVersion: 1
  exportedAt: string
  app: "PesoPilot"
  data: {
    accounts: Account[]
    categories: Category[]
    transactions: Transaction[]
    budgets: MonthlyBudget[]
    goals: SavingsGoal[]
    bills: Bill[]
    settings: AppSettings[]
  }
}

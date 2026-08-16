import type {
  Account,
  AppSettings,
  AttachmentMetadata,
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

export interface FinanceBackupDataV1 {
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  budgets: MonthlyBudget[]
  goals: SavingsGoal[]
  bills: Bill[]
  settings: AppSettings[]
}

export interface LegacyFinanceBackup {
  schemaVersion: 1
  exportedAt: string
  app: "PesoPilot"
  data: FinanceBackupDataV1
}

export interface BackupAttachment
  extends Omit<AttachmentMetadata, "thumbnailBlob"> {
  originalPath: string
  thumbnailPath: string
}

export interface FinanceBackup {
  schemaVersion: 2
  exportedAt: string
  app: "PesoPilot"
  data: FinanceBackupDataV1 & {
    attachments: BackupAttachment[]
  }
}

export type SupportedFinanceBackup = LegacyFinanceBackup | FinanceBackup

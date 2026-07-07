export type Id = string

export type CurrencyCode = "PHP"

export type InstitutionKey =
  | "cash"
  | "gcash"
  | "maya"
  | "gotyme"
  | "seabank"
  | "cimb"
  | "tonik"
  | "bpi"
  | "bdo"
  | "metrobank"
  | "landbank"
  | "rcbc"
  | "unionbank"
  | "security_bank"
  | "pnb"
  | "chinabank"
  | "other"

export type InstitutionCategory =
  | "cash"
  | "bank"
  | "digital_bank"
  | "ewallet"
  | "investment_platform"
  | "other"

export type AccountProductType =
  | "cash"
  | "wallet"
  | "savings"
  | "checking"
  | "credit_card"
  | "loan"
  | "investment"
  | "time_deposit"
  | "emergency_fund"
  | "other"

export type BalanceNature = "asset" | "liability"

export type AccountType =
  | "cash"
  | "bank"
  | "digital_bank"
  | "ewallet"
  | "investment"
  | "debt"
  // Legacy values kept so old IndexedDB records and backups stay readable.
  | "savings"
  | "credit"
  | "loan"

export type TransactionType = "income" | "expense" | "transfer"

export type CategoryKind = "income" | "expense"

export type BudgetMethod = "zero-based" | "fifty-thirty-twenty" | "envelope"

export type BillFrequency = "monthly" | "weekly" | "yearly"

export type GoalStatus = "active" | "paused" | "completed"

export interface BaseRecord {
  id: Id
  createdAt: string
  updatedAt: string
}

export interface Account extends BaseRecord {
  // Compatibility alias for existing screens/backups. New UI uses displayName.
  name: string
  // Legacy provider-type field kept so old IndexedDB rows and backups migrate safely.
  type?: AccountType
  iconKey?: string
  institutionKey: InstitutionKey
  institutionName: string
  institutionCategory: InstitutionCategory
  accountProductType: AccountProductType
  balanceNature: BalanceNature
  displayName: string
  customDisplayName?: string
  logoAsset?: string
  logoText?: string
  openingBalanceCentavos: number
  balanceCentavos: number
  currency: CurrencyCode
  includeInNetWorth: boolean
  color?: string
  creditLimitCentavos?: number
  statementDay?: number
  paymentDueDay?: number
  lastStatementDate?: string
  currentStatementBalanceCentavos?: number
  availableCreditCentavos?: number
  archived: boolean
}

export interface Category extends BaseRecord {
  name: string
  kind: CategoryKind
  color: string
  system: boolean
}

export interface Transaction extends BaseRecord {
  type: TransactionType
  amountCentavos: number
  accountId: Id
  transferAccountId?: Id
  categoryId?: Id
  billId?: Id
  date: string
  description: string
  notes?: string
}

export interface MonthlyBudget extends BaseRecord {
  monthId: string
  categoryId: Id
  limitCentavos: number
}

export interface SavingsGoal extends BaseRecord {
  name: string
  targetCentavos: number
  currentCentavos: number
  targetDate?: string
  linkedAccountId?: Id
  status: GoalStatus
}

export interface Bill extends BaseRecord {
  name: string
  amountCentavos: number
  accountId?: Id
  categoryId?: Id
  dueDay: number
  frequency: BillFrequency
  autopay: boolean
  active: boolean
  notes?: string
}

export interface AppSettings extends BaseRecord {
  appName: string
  displayName?: string
  currency: CurrencyCode
  locale: "en-PH"
  timezone: "Asia/Manila"
  budgetMethod: BudgetMethod
  showInstallTips: boolean
}

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

export interface AccountFormValues {
  id?: Id
  institutionKey: InstitutionKey
  accountProductType: AccountProductType
  openingBalance: string
  creditLimit?: string
  statementDay?: number
  paymentDueDay?: number
  includeInNetWorth: boolean
  allowOverLimit?: boolean
}

export interface TransactionFormValues {
  id?: Id
  type: TransactionType
  amount: string
  accountId: Id
  transferAccountId?: Id
  categoryId?: Id
  billId?: Id
  date: string
  description: string
  notes?: string
}

export interface BudgetFormValues {
  id?: Id
  monthId: string
  categoryId: Id
  limit: string
}

export interface GoalFormValues {
  id?: Id
  name: string
  target: string
  current: string
  targetDate?: string
  linkedAccountId?: Id
  status: GoalStatus
}

export interface BillFormValues {
  id?: Id
  name: string
  amount: string
  accountId?: Id
  categoryId?: Id
  dueDay: number
  frequency: BillFrequency
  autopay: boolean
  active: boolean
  notes?: string
}

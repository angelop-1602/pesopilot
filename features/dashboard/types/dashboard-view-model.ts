import type {
  Account,
  Category,
  SavingsGoal,
  Transaction,
} from "@/types/finance"

export interface DashboardViewModel {
  accounts: Account[]
  categories: Category[]
  recentTransactions: Transaction[]
  goals: SavingsGoal[]
  monthLabel: string
  netWorthCentavos: number
  availableAssetsCentavos: number
  pendingCommitmentsCentavos: number
  safeToSpendCentavos: number
  incomeCentavos: number
  expenseCentavos: number
  netCentavos: number
  budgetedCentavos: number
  spentCentavos: number
}

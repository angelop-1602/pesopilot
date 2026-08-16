import { RiBankCardLine } from "@remixicon/react"

import type {
  Account,
  Bill,
  Category,
  MonthlyBudget,
  Transaction,
} from "@/types/finance"
import type { CreditCardStatementSummary } from "@/lib/finance/credit-card-statements"
import { AccountDialog } from "@/features/accounts/components/account-dialog"
import { CreditCardRow } from "@/features/budget/components/credit-cards/credit-card-row"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { getBalanceNature } from "@/lib/finance/accounts"

const CREDIT_CARD_PAYMENT_SOURCE_TYPES = new Set([
  "cash",
  "wallet",
  "savings",
  "checking",
  "emergency_fund",
])

interface CreditCardsPanelProps {
  accounts: Account[]
  bills: Bill[]
  budgets: MonthlyBudget[]
  categories: Category[]
  summaries: CreditCardStatementSummary[]
  transactions: Transaction[]
}

export function CreditCardsPanel({
  accounts,
  bills,
  budgets,
  categories,
  summaries,
  transactions,
}: CreditCardsPanelProps) {
  const sourceAccounts = accounts.filter(
    (account) =>
      !account.archived &&
      getBalanceNature(account) === "asset" &&
      CREDIT_CARD_PAYMENT_SOURCE_TYPES.has(account.accountProductType)
  )

  if (summaries.length === 0) {
    return (
      <EmptyState
        icon={<RiBankCardLine aria-hidden="true" />}
        title="No credit cards"
        description="Add a credit card to track its limit, statement, due date, and payments."
        action={
          <AccountDialog
            trigger={<Button className="rounded-full">Add account</Button>}
          />
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Card purchases spend their selected budget. Paying a statement is a
        transfer, so the same purchase is never counted twice.
      </p>
      <div className="overflow-hidden rounded-[1.6rem] bg-white/78 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        {summaries.map((summary) => (
          <CreditCardRow
            accounts={accounts}
            bills={bills}
            budgets={budgets}
            categories={categories}
            key={summary.account.id}
            sourceAccounts={sourceAccounts}
            summary={summary}
            transactions={transactions}
          />
        ))}
      </div>
    </div>
  )
}

import type { AccountProductType, BalanceNature } from "@/types/finance"

export type AccountProductOption = {
  key: AccountProductType
  label: string
  balanceNature: BalanceNature
  description: string
}

export const accountProducts: AccountProductOption[] = [
  {
    key: "cash",
    label: "Cash",
    balanceNature: "asset",
    description: "Physical cash or money on hand.",
  },
  {
    key: "wallet",
    label: "Wallet",
    balanceNature: "asset",
    description: "Spendable e-wallet balance.",
  },
  {
    key: "savings",
    label: "Savings",
    balanceNature: "asset",
    description: "Savings account or stored money.",
  },
  {
    key: "checking",
    label: "Checking",
    balanceNature: "asset",
    description: "Checking or current account.",
  },
  {
    key: "credit_card",
    label: "Credit Card",
    balanceNature: "liability",
    description: "Credit card balance owed.",
  },
  {
    key: "loan",
    label: "Loan",
    balanceNature: "liability",
    description: "Loan or installment balance owed.",
  },
  {
    key: "investment",
    label: "Investment",
    balanceNature: "asset",
    description: "Investment, fund, or portfolio value.",
  },
  {
    key: "time_deposit",
    label: "Time Deposit",
    balanceNature: "asset",
    description: "Locked savings or fixed deposit.",
  },
  {
    key: "emergency_fund",
    label: "Emergency Fund",
    balanceNature: "asset",
    description: "Dedicated emergency savings.",
  },
  {
    key: "other",
    label: "Other",
    balanceNature: "asset",
    description: "Custom account product.",
  },
]

export const accountProductLabels = Object.fromEntries(
  accountProducts.map((product) => [product.key, product.label])
) as Record<AccountProductType, string>

export function getAccountProduct(productType: AccountProductType) {
  return (
    accountProducts.find((product) => product.key === productType) ??
    accountProducts.find((product) => product.key === "other")!
  )
}

export function getAccountProductLabel(productType: AccountProductType) {
  return getAccountProduct(productType).label
}

export function getBalanceNatureForProduct(productType: AccountProductType) {
  return getAccountProduct(productType).balanceNature
}

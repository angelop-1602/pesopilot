import {
  RiBankCardLine,
  RiDashboardLine,
  RiPieChartLine,
  RiWallet3Line,
} from "@remixicon/react"

export const PRIMARY_NAVIGATION = [
  {
    href: "/",
    label: "Home",
    icon: RiDashboardLine,
  },
  {
    href: "/transactions",
    label: "Activity",
    icon: RiBankCardLine,
  },
  {
    href: "/accounts",
    label: "Accounts",
    icon: RiWallet3Line,
  },
  {
    href: "/budget",
    label: "Budget",
    icon: RiPieChartLine,
  },
] as const

export const ACCOUNT_TYPE_LABELS = {
  cash: "Cash",
  bank: "Bank",
  digital_bank: "Digital Bank",
  ewallet: "E-wallet",
  investment: "Investment",
  debt: "Debt",
  savings: "Savings",
  credit: "Credit card",
  loan: "Loan",
} as const

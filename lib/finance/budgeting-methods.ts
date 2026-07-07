import type { BudgetMethod } from "@/types/finance"

export const BUDGETING_METHODS: Array<{
  id: BudgetMethod
  name: string
  description: string
}> = [
  {
    id: "zero-based",
    name: "Zero-based",
    description: "Assign every peso to spending, saving, or debt payoff.",
  },
  {
    id: "fifty-thirty-twenty",
    name: "50/30/20",
    description: "Balance needs, wants, and savings with simple guardrails.",
  },
  {
    id: "envelope",
    name: "Envelope",
    description: "Give each category a spending envelope for the month.",
  },
]

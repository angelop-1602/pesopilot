import type { Id } from "@/types/finance"

export interface BudgetFormValues {
  id?: Id
  monthId: string
  categoryId: Id
  limit: string
}

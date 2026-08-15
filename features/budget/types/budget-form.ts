import type { Id } from "@/types/finance"

export interface BudgetFormValues {
  id?: Id
  name: string
  monthId: string
  categoryId: Id
  limit: string
}

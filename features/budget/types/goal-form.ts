import type { GoalStatus, Id } from "@/types/finance"

export interface GoalFormValues {
  id?: Id
  name: string
  target: string
  current: string
  targetDate?: string
  linkedAccountId?: Id
  status: GoalStatus
}

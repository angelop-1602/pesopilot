import type { SavingsGoal } from "@/types/finance"

export function getGoalProgress(goal: SavingsGoal) {
  if (goal.targetCentavos <= 0) {
    return 0
  }

  return Math.min(100, (goal.currentCentavos / goal.targetCentavos) * 100)
}

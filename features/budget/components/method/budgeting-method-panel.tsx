"use client"

import { useState } from "react"
import { toast } from "sonner"

import type { BudgetMethod } from "@/types/finance"
import { setBudgetingMethod } from "@/features/budget/services/budgeting-method-commands"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BUDGETING_METHODS } from "@/lib/finance/budgeting-methods"

export function BudgetingMethodPanel({
  budgetMethod,
}: {
  budgetMethod: BudgetMethod
}) {
  const [optimisticMethod, setOptimisticMethod] = useState<BudgetMethod | null>(
    null
  )
  const activeMethod = optimisticMethod ?? budgetMethod

  return (
    <div className="overflow-hidden rounded-[1.6rem] bg-white/78 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
      {BUDGETING_METHODS.map((method) => (
        <div
          className="flex items-start justify-between gap-3 border-b border-border/70 p-4 last:border-b-0"
          key={method.id}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold">{method.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {method.description}
            </p>
          </div>
          {activeMethod === method.id ? (
            <Badge className="shrink-0">Active</Badge>
          ) : (
            <Button
              className="shrink-0 rounded-full"
              variant="outline"
              onClick={async () => {
                setOptimisticMethod(method.id)
                try {
                  await setBudgetingMethod(method.id)
                  window.setTimeout(() => setOptimisticMethod(null), 150)
                  toast.success("Budget method updated")
                } catch (error) {
                  setOptimisticMethod(null)
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Unable to update budget method."
                  )
                }
              }}
            >
              Use
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

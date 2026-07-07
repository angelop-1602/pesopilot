"use client"

import Link from "next/link"
import { RiFlagLine, RiPieChartLine } from "@remixicon/react"

import type { SavingsGoal } from "@/types/finance"
import { Progress } from "@/components/ui/progress"
import { getGoalProgress } from "@/lib/finance/calculations"
import { formatPeso } from "@/lib/finance/currency"

interface BudgetGoalPreviewProps {
  budgetedCentavos: number
  goals: SavingsGoal[]
  spentCentavos: number
}

export function BudgetGoalPreview({
  budgetedCentavos,
  goals,
  spentCentavos,
}: BudgetGoalPreviewProps) {
  const primaryGoal = goals.find((goal) => goal.status === "active") ?? goals[0]
  const budgetProgress =
    budgetedCentavos > 0 ? Math.min(100, (spentCentavos / budgetedCentavos) * 100) : 0

  return (
    <section className="flex flex-col gap-3 rounded-[1.7rem] bg-white/74 p-4 shadow-[0_14px_38px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold">Plan</h2>
          <p className="text-xs text-muted-foreground">
            Budget and savings pulse
          </p>
        </div>
        <Link href="/budget" className="text-xs font-semibold text-primary">
          Open
        </Link>
      </div>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <RiPieChartLine className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Monthly budget</p>
            <p className="font-mono text-xs font-semibold">
              {budgetedCentavos > 0
                ? `${Math.round(budgetProgress)}%`
                : "Not set"}
            </p>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {budgetedCentavos > 0
              ? `${formatPeso(spentCentavos)} of ${formatPeso(budgetedCentavos)}`
              : "Create a budget to start tracking spend."}
          </p>
          <Progress className="mt-2" value={budgetProgress} />
        </div>
      </div>
      <div className="border-t border-border/70 pt-3">
        {primaryGoal ? (
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <RiFlagLine className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold">
                  {primaryGoal.name}
                </p>
                <p className="font-mono text-xs font-semibold">
                  {Math.round(getGoalProgress(primaryGoal))}%
                </p>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {formatPeso(primaryGoal.currentCentavos)} saved of{" "}
                {formatPeso(primaryGoal.targetCentavos)}
              </p>
              <Progress className="mt-2" value={getGoalProgress(primaryGoal)} />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <RiFlagLine className="size-5" aria-hidden="true" />
            </span>
            <span>No savings goal yet.</span>
          </div>
        )}
      </div>
    </section>
  )
}

import { formatPeso } from "@/lib/finance/currency"
import { cn } from "@/lib/utils"

export function BudgetSummary({
  budgetedCentavos,
  spentCentavos,
}: {
  budgetedCentavos: number
  spentCentavos: number
}) {
  return (
    <div className="rounded-[1.65rem] bg-white/76 p-3 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
      <div className="grid grid-cols-2 divide-x divide-border/70">
        <SummaryValue label="Budgeted" value={budgetedCentavos} />
        <SummaryValue
          label="Spent"
          tone={spentCentavos > budgetedCentavos ? "danger" : "default"}
          value={spentCentavos}
        />
      </div>
    </div>
  )
}

function SummaryValue({
  label,
  tone = "default",
  value,
}: {
  label: string
  tone?: "default" | "danger"
  value: number
}) {
  return (
    <div className="min-w-0 px-2 text-center">
      <p className="text-[0.68rem] font-semibold text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate font-mono text-sm font-semibold",
          tone === "danger" && "text-destructive"
        )}
      >
        {formatPeso(value)}
      </p>
    </div>
  )
}

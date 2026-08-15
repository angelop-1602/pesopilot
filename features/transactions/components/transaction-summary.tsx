import { formatPeso } from "@/lib/finance/currency"
import { cn } from "@/lib/utils"

interface TransactionSummaryProps {
  expenseCentavos: number
  incomeCentavos: number
  netCentavos: number
}

export function TransactionSummary({
  expenseCentavos,
  incomeCentavos,
  netCentavos,
}: TransactionSummaryProps) {
  return (
    <div className="rounded-[1.65rem] bg-white/76 p-3 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
      <div className="grid grid-cols-3 divide-x divide-border/70">
        <SummaryValue label="Income" value={incomeCentavos} />
        <SummaryValue
          label="Spent"
          tone={expenseCentavos > incomeCentavos ? "danger" : "default"}
          value={expenseCentavos}
        />
        <SummaryValue
          label="Net"
          tone={netCentavos >= 0 ? "good" : "danger"}
          value={netCentavos}
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
  tone?: "default" | "danger" | "good"
  value: number
}) {
  return (
    <div className="min-w-0 px-2 text-center">
      <p className="text-[0.68rem] font-semibold text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate font-mono text-xs font-semibold",
          tone === "danger" && "text-destructive",
          tone === "good" && "text-primary"
        )}
      >
        {formatPeso(value)}
      </p>
    </div>
  )
}

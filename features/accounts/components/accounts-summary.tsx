import { RiAddLine } from "@remixicon/react"

import { AccountDialog } from "@/features/accounts/components/account-dialog"
import { Button } from "@/components/ui/button"
import { formatPeso } from "@/lib/finance/currency"

interface AccountsSummaryProps {
  availableCentavos: number
  debtCentavos: number
  netWorthCentavos: number
}

export function AccountsSummary({
  availableCentavos,
  debtCentavos,
  netWorthCentavos,
}: AccountsSummaryProps) {
  return (
    <div className="rounded-[1.8rem] bg-[linear-gradient(145deg,oklch(0.24_0.08_165),oklch(0.21_0.07_225))] p-5 text-white shadow-[0_20px_48px_rgba(6,78,59,0.2)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-white/68">Net worth</p>
          <p className="mt-2 break-words font-mono text-3xl font-semibold">
            {formatPeso(netWorthCentavos)}
          </p>
        </div>
        <AccountDialog
          trigger={
            <Button className="rounded-full">
              <RiAddLine data-icon="inline-start" aria-hidden="true" />
              Add account
            </Button>
          }
        />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-[1.1rem] bg-white/12 p-3">
          <p className="text-[0.7rem] font-medium text-white/68">Available</p>
          <p className="mt-1 truncate font-mono text-sm font-semibold">
            {formatPeso(availableCentavos)}
          </p>
        </div>
        <div className="rounded-[1.1rem] bg-white/12 p-3">
          <p className="text-[0.7rem] font-medium text-white/68">Owed</p>
          <p className="mt-1 truncate font-mono text-sm font-semibold">
            {formatPeso(debtCentavos)}
          </p>
        </div>
      </div>
    </div>
  )
}

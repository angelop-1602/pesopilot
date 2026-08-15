import { notifyDataChanged } from "@/lib/db/change-events"
import { closeCreditCardStatementsIfNeeded } from "@/lib/db/account-maintenance"
import { ensureSeedData } from "@/lib/db/seed"

let maintenanceComplete = false
let maintenancePromise: Promise<void> | undefined

export async function runFinanceMaintenance() {
  await ensureSeedData()
  await closeCreditCardStatementsIfNeeded()
  notifyDataChanged()
}

export function ensureFinanceMaintenance() {
  if (maintenanceComplete) {
    return Promise.resolve()
  }

  maintenancePromise ??= runFinanceMaintenance().then(
    () => {
      maintenanceComplete = true
      maintenancePromise = undefined
    },
    (error: unknown) => {
      maintenancePromise = undefined
      throw error
    }
  )

  return maintenancePromise
}

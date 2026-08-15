import type { Bill } from "@/types/finance"
import { getDb } from "@/lib/db/client"

export function getBill(id: string) {
  return getDb().bills.get(id)
}

export function putBill(bill: Bill) {
  return getDb().bills.put(bill)
}

export function deleteBillRecord(id: string) {
  return getDb().bills.delete(id)
}

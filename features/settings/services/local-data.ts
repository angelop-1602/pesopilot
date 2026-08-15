import { notifyDataChanged } from "@/lib/db/change-events"
import { clearLocalData } from "@/lib/db/repositories/backup-data"
import { ensureSeedData } from "@/lib/db/seed"

export async function resetLocalData() {
  await clearLocalData()
  await ensureSeedData()
  notifyDataChanged()
}

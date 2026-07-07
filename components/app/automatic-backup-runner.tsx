"use client"

import { useEffect } from "react"

import { writeAutomaticBackup } from "@/lib/db/repositories/backup"
import { subscribeToDataChanges } from "@/lib/db/change-events"

const BACKUP_DEBOUNCE_MS = 900

export function AutomaticBackupRunner() {
  useEffect(() => {
    let timeoutId: number | undefined

    const runBackup = () => {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        void writeAutomaticBackup().catch(() => {
          // Settings shows the latest automatic backup error from IndexedDB.
        })
      }, BACKUP_DEBOUNCE_MS)
    }

    const unsubscribe = subscribeToDataChanges(runBackup)

    return () => {
      window.clearTimeout(timeoutId)
      unsubscribe()
    }
  }, [])

  return null
}

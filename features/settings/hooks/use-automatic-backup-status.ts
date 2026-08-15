"use client"

import { useCallback } from "react"

import { getAutomaticBackupStatus } from "@/features/settings/services/automatic-backup"
import type { AutomaticBackupStatus } from "@/features/settings/types/backup"
import { useLiveQuery } from "@/lib/hooks/use-live-query"

export function useAutomaticBackupStatus() {
  const query = useCallback(() => getAutomaticBackupStatus(), [])
  const { data, error, refresh } = useLiveQuery<AutomaticBackupStatus | null>(
    query,
    null
  )

  return {
    error:
      error instanceof Error
        ? error.message
        : error
          ? "Unable to read automatic backup status."
          : null,
    refreshStatus: refresh,
    status: data,
  }
}

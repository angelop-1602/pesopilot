"use client"

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

import {
  createEmptyFinanceSnapshot,
  getFinanceSnapshot,
  type FinanceSnapshot,
} from "@/lib/db/queries/finance-snapshot"
import { ensureFinanceMaintenance } from "@/lib/db/maintenance"
import { useLiveQuery } from "@/lib/hooks/use-live-query"

export type { FinanceSnapshot }

const emptySnapshot = createEmptyFinanceSnapshot()

interface FinanceDataState {
  data: FinanceSnapshot
  error: unknown
  isLoading: boolean
}

const FinanceDataContext = createContext<FinanceDataState | null>(null)

export function FinanceDataProvider({ children }: { children: ReactNode }) {
  const [maintenanceError, setMaintenanceError] = useState<unknown>(null)

  useEffect(() => {
    let isMounted = true

    void ensureFinanceMaintenance().catch((error: unknown) => {
      if (isMounted) {
        setMaintenanceError(error)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  const query = useCallback(() => getFinanceSnapshot(), [])

  const financeData = useLiveQuery<FinanceSnapshot>(query, emptySnapshot)
  const value = maintenanceError
    ? { ...financeData, error: financeData.error ?? maintenanceError }
    : financeData

  return createElement(
    FinanceDataContext.Provider,
    { value },
    children
  )
}

export function useFinanceData() {
  const financeData = useContext(FinanceDataContext)

  if (!financeData) {
    throw new Error("useFinanceData must be used within FinanceDataProvider.")
  }

  return financeData
}

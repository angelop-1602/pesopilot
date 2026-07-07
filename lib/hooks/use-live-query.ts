"use client"

import { liveQuery } from "dexie"
import { useCallback, useEffect, useState } from "react"

import { subscribeToDataChanges } from "@/lib/db/change-events"

export function useLiveQuery<T>(
  query: () => Promise<T>,
  initialValue: T
) {
  const [value, setValue] = useState<T>(initialValue)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const runQuery = useCallback(async () => {
    try {
      const nextValue = await query()
      setValue(nextValue)
      setError(null)
      setIsLoading(false)
    } catch (nextError) {
      setError(nextError)
      setIsLoading(false)
    }
  }, [query])

  useEffect(() => {
    const subscription = liveQuery(query).subscribe({
      next: (nextValue) => {
        setValue(nextValue)
        setError(null)
        setIsLoading(false)
      },
      error: (nextError) => {
        setError(nextError)
        setIsLoading(false)
      },
    })
    const unsubscribeDataChanges = subscribeToDataChanges(() => {
      void runQuery()
    })

    return () => {
      subscription.unsubscribe()
      unsubscribeDataChanges()
    }
  }, [query, runQuery])

  return { data: value, isLoading, error }
}

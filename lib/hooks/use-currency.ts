"use client"

import { formatPeso } from "@/lib/finance/currency"

export function useCurrency() {
  return {
    currency: "PHP" as const,
    locale: "en-PH" as const,
    timezone: "Asia/Manila" as const,
    format: formatPeso,
  }
}

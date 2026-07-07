export const PHP_CURRENCY = "PHP"
export const PH_LOCALE = "en-PH"

const pesoFormatter = new Intl.NumberFormat(PH_LOCALE, {
  style: "currency",
  currency: PHP_CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactPesoFormatter = new Intl.NumberFormat(PH_LOCALE, {
  style: "currency",
  currency: PHP_CURRENCY,
  notation: "compact",
  maximumFractionDigits: 1,
})

export function formatPeso(centavos: number) {
  return pesoFormatter.format(centavos / 100)
}

export function formatCompactPeso(centavos: number) {
  return compactPesoFormatter.format(centavos / 100)
}

export function pesosToCentavos(value: string | number) {
  if (typeof value === "number") {
    return Math.round(value * 100)
  }

  const normalized = value.replace(/[^\d.-]/g, "")
  const parsed = Number.parseFloat(normalized)

  if (!Number.isFinite(parsed)) {
    return 0
  }

  return Math.round(parsed * 100)
}

export function centavosToInput(centavos: number) {
  return (centavos / 100).toFixed(2)
}

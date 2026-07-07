const PH_TIMEZONE = "Asia/Manila"

function getManilaParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PH_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  return formatter.formatToParts(date).reduce<Record<string, string>>(
    (parts, part) => {
      if (part.type !== "literal") {
        parts[part.type] = part.value
      }
      return parts
    },
    {}
  )
}

export function getCurrentMonthId() {
  const parts = getManilaParts()
  return `${parts.year}-${parts.month}`
}

export function getTodayInputDate() {
  const parts = getManilaParts()
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function getMonthId(date: string | Date) {
  const target = typeof date === "string" ? new Date(`${date}T00:00:00`) : date
  const parts = getManilaParts(target)
  return `${parts.year}-${parts.month}`
}

export function shiftMonth(monthId: string, amount: number) {
  const [year, month] = monthId.split("-").map(Number)
  const date = new Date(year, month - 1 + amount, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function formatMonthLabel(monthId: string) {
  const [year, month] = monthId.split("-").map(Number)
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
    timeZone: PH_TIMEZONE,
  }).format(new Date(year, month - 1, 1))
}

export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: PH_TIMEZONE,
  }).format(new Date(`${date}T00:00:00`))
}

export function makeMonthOptions(centerMonthId = getCurrentMonthId()) {
  return Array.from({ length: 18 }, (_, index) => {
    const monthId = shiftMonth(centerMonthId, index - 12)
    return {
      value: monthId,
      label: formatMonthLabel(monthId),
    }
  })
}

export function getBillDueDate(monthId: string, dueDay: number) {
  const [year, month] = monthId.split("-").map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  return `${monthId}-${String(Math.min(dueDay, lastDay)).padStart(2, "0")}`
}

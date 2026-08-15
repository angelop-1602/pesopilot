const PH_TIMEZONE = "Asia/Manila"
const INPUT_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const MONTH_ID_PATTERN = /^(\d{4})-(\d{2})$/

function formatInputDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getUTCDate()).padStart(2, "0")}`
}

export function getInputDateParts(date: string) {
  const match = INPUT_DATE_PATTERN.exec(date)

  if (!match) {
    return undefined
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (year < 1000 || month < 1 || month > 12 || day < 1) {
    return undefined
  }

  const candidate = new Date(Date.UTC(year, month - 1, day))

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return undefined
  }

  return { year, month, day }
}

export function getMonthParts(monthId: string) {
  const match = MONTH_ID_PATTERN.exec(monthId)

  if (!match) {
    return undefined
  }

  const year = Number(match[1])
  const month = Number(match[2])

  if (year < 1000 || month < 1 || month > 12) {
    return undefined
  }

  return { year, month }
}

export function isInputDate(date: string) {
  return getInputDateParts(date) !== undefined
}

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
  if (typeof date === "string") {
    const inputDate = date.slice(0, 10)

    if (isInputDate(inputDate)) {
      return inputDate.slice(0, 7)
    }
  }

  const target = typeof date === "string" ? new Date(date) : date
  const parts = getManilaParts(target)
  return `${parts.year}-${parts.month}`
}

export function shiftMonth(monthId: string, amount: number) {
  const parts = getMonthParts(monthId)

  if (!parts) {
    throw new RangeError(`Invalid month identifier: ${monthId}`)
  }

  const date = new Date(Date.UTC(parts.year, parts.month - 1 + amount, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}`
}

export function formatMonthLabel(monthId: string) {
  const parts = getMonthParts(monthId)

  if (!parts) {
    return monthId
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
    timeZone: PH_TIMEZONE,
  }).format(new Date(Date.UTC(parts.year, parts.month - 1, 1, 12)))
}

export function formatShortDate(date: string) {
  const parts = getInputDateParts(date)

  if (!parts) {
    return date
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: PH_TIMEZONE,
  }).format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12)))
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
  const parts = getMonthParts(monthId)

  if (!parts) {
    throw new RangeError(`Invalid month identifier: ${monthId}`)
  }

  const lastDay = new Date(Date.UTC(parts.year, parts.month, 0)).getUTCDate()
  const normalizedDueDay = Number.isFinite(dueDay) ? Math.trunc(dueDay) : 1
  const day = Math.max(1, Math.min(normalizedDueDay, lastDay))

  return `${monthId}-${String(day).padStart(2, "0")}`
}

export function getMonthDateRange(monthId: string) {
  return {
    startDate: getBillDueDate(monthId, 1),
    endDateExclusive: getBillDueDate(shiftMonth(monthId, 1), 1),
  }
}

export function isDateInMonth(date: string, monthId: string) {
  const inputDate = date.slice(0, 10)
  return isInputDate(inputDate) && inputDate.slice(0, 7) === monthId
}

export function addDays(date: string, amount: number) {
  const parts = getInputDateParts(date)

  if (!parts) {
    throw new RangeError(`Invalid input date: ${date}`)
  }

  const target = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
  target.setUTCDate(target.getUTCDate() + amount)
  return formatInputDate(target)
}

export function differenceInCalendarDays(date: string, earlierDate: string) {
  const parts = getInputDateParts(date)
  const earlierParts = getInputDateParts(earlierDate)

  if (!parts || !earlierParts) {
    throw new RangeError("Calendar-day differences require valid input dates.")
  }

  const timestamp = Date.UTC(parts.year, parts.month - 1, parts.day)
  const earlierTimestamp = Date.UTC(
    earlierParts.year,
    earlierParts.month - 1,
    earlierParts.day
  )

  return Math.round((timestamp - earlierTimestamp) / 86_400_000)
}

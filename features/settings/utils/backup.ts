const BACKUP_CHARACTER_GROUPS = [
  "ABCDEFGHJKLMNPQRSTUVWXYZ",
  "abcdefghijkmnopqrstuvwxyz",
  "23456789",
  "!@#$%&*?",
] as const

const BACKUP_CHARACTERS = BACKUP_CHARACTER_GROUPS.join("")

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function formatBackupTimestamp(value?: string) {
  if (!value) {
    return "Never"
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function generateBackupPassword(length = 24) {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Secure password generation is not available.")
  }

  const password: string[] = []
  const maxValue =
    Math.floor(256 / BACKUP_CHARACTERS.length) * BACKUP_CHARACTERS.length -
    1

  while (password.length < length) {
    const bytes = new Uint8Array(length)
    globalThis.crypto.getRandomValues(bytes)

    for (const byte of bytes) {
      if (byte > maxValue) {
        continue
      }

      password.push(
        BACKUP_CHARACTERS[byte % BACKUP_CHARACTERS.length]
      )

      if (password.length === length) {
        break
      }
    }
  }

  return password.join("")
}

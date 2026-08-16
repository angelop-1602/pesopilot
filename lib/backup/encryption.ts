import type { LegacyFinanceBackup } from "@/lib/backup/types"

const ENCRYPTED_BACKUP_KIND = "encrypted-backup"
const LEGACY_ENCRYPTED_BACKUP_VERSION = 1
const ARCHIVE_ENCRYPTED_BACKUP_VERSION = 2
const KDF_ITERATIONS = 250000
const SALT_BYTES = 16
const IV_BYTES = 12

interface EncryptedBackupEnvelopeBase {
  app: "PesoPilot"
  kind: typeof ENCRYPTED_BACKUP_KIND
  exportedAt: string
  kdf: {
    name: "PBKDF2"
    hash: "SHA-256"
    iterations: number
    salt: string
  }
  cipher: {
    name: "AES-GCM"
    iv: string
  }
  payload: string
}

export interface LegacyEncryptedBackupEnvelope
  extends EncryptedBackupEnvelopeBase {
  version: typeof LEGACY_ENCRYPTED_BACKUP_VERSION
}

export interface ArchiveEncryptedBackupEnvelope
  extends EncryptedBackupEnvelopeBase {
  version: typeof ARCHIVE_ENCRYPTED_BACKUP_VERSION
  format: "zip"
}

export type EncryptedBackupEnvelope =
  | LegacyEncryptedBackupEnvelope
  | ArchiveEncryptedBackupEnvelope

export type DecryptedBackupPayload =
  | { format: "json"; value: unknown }
  | { format: "zip"; value: Uint8Array }

export function isEncryptedBackupEnvelope(
  input: unknown
): input is EncryptedBackupEnvelope {
  if (!input || typeof input !== "object") {
    return false
  }

  const record = input as Record<string, unknown>

  return (
    record.app === "PesoPilot" &&
    record.kind === ENCRYPTED_BACKUP_KIND &&
    (record.version === LEGACY_ENCRYPTED_BACKUP_VERSION ||
      (record.version === ARCHIVE_ENCRYPTED_BACKUP_VERSION &&
        record.format === "zip")) &&
    typeof record.exportedAt === "string" &&
    typeof record.payload === "string" &&
    isRecord(record.kdf) &&
    record.kdf.name === "PBKDF2" &&
    record.kdf.hash === "SHA-256" &&
    record.kdf.iterations === KDF_ITERATIONS &&
    typeof record.kdf.salt === "string" &&
    isRecord(record.cipher) &&
    record.cipher.name === "AES-GCM" &&
    typeof record.cipher.iv === "string"
  )
}

export async function encryptBackup(
  backup: LegacyFinanceBackup,
  password: string
): Promise<EncryptedBackupEnvelope> {
  const encodedBackup = new TextEncoder().encode(JSON.stringify(backup))

  return encryptBytes(
    encodedBackup,
    backup.exportedAt,
    LEGACY_ENCRYPTED_BACKUP_VERSION,
    password
  )
}

export function encryptBackupArchive(
  archive: Uint8Array,
  exportedAt: string,
  password: string
) {
  return encryptBytes(
    archive,
    exportedAt,
    ARCHIVE_ENCRYPTED_BACKUP_VERSION,
    password
  )
}

export async function decryptBackup(
  envelope: EncryptedBackupEnvelope,
  password: string
): Promise<unknown> {
  const payload = await decryptBackupPayload(envelope, password)

  if (payload.format !== "json") {
    throw new Error("This backup contains an archive instead of JSON data.")
  }

  return payload.value
}

export async function decryptBackupPayload(
  envelope: EncryptedBackupEnvelope,
  password: string
): Promise<DecryptedBackupPayload> {
  const decrypted = await decryptBytes(envelope, password)

  if (envelope.version === ARCHIVE_ENCRYPTED_BACKUP_VERSION) {
    return { format: "zip", value: decrypted }
  }

  try {
    return {
      format: "json",
      value: JSON.parse(new TextDecoder().decode(decrypted)) as unknown,
    }
  } catch {
    throw new Error("Decrypted backup is not valid JSON.")
  }
}

async function encryptBytes(
  bytes: Uint8Array,
  exportedAt: string,
  version: 1 | 2,
  password: string
): Promise<EncryptedBackupEnvelope> {
  assertBackupPassword(password)

  const crypto = getCrypto()
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const key = await deriveKey(password, salt)
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(bytes)
  )

  const base: EncryptedBackupEnvelopeBase = {
    app: "PesoPilot",
    kind: ENCRYPTED_BACKUP_KIND,
    exportedAt,
    kdf: {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: KDF_ITERATIONS,
      salt: bytesToBase64(salt),
    },
    cipher: {
      name: "AES-GCM",
      iv: bytesToBase64(iv),
    },
    payload: bytesToBase64(new Uint8Array(encrypted)),
  }

  return version === ARCHIVE_ENCRYPTED_BACKUP_VERSION
    ? { ...base, version, format: "zip" }
    : { ...base, version }
}

async function decryptBytes(
  envelope: EncryptedBackupEnvelope,
  password: string
) {
  assertBackupPassword(password)

  try {
    const key = await deriveKey(password, base64ToBytes(envelope.kdf.salt))
    const decrypted = await getCrypto().subtle.decrypt(
      {
        name: "AES-GCM",
        iv: toArrayBuffer(base64ToBytes(envelope.cipher.iv)),
      },
      key,
      toArrayBuffer(base64ToBytes(envelope.payload))
    )
    return new Uint8Array(decrypted)
  } catch {
    throw new Error("Unable to decrypt backup. Check the backup password.")
  }
}

export function createEncryptedBackupBlob(
  envelope: EncryptedBackupEnvelope
): Blob {
  return new Blob([JSON.stringify(envelope, null, 2)], {
    type: "application/json",
  })
}

async function deriveKey(password: string, salt: Uint8Array) {
  const material = await getCrypto().subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  )

  return getCrypto().subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toArrayBuffer(salt),
      iterations: KDF_ITERATIONS,
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

export function assertBackupPassword(password: string) {
  if (password.trim().length < 8) {
    throw new Error("Backup password must be at least 8 characters.")
  }
}

function getCrypto() {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Encrypted backups need Web Crypto support.")
  }

  return globalThis.crypto
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === "object"
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ""
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

function base64ToBytes(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer
}

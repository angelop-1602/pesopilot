import {
  strFromU8,
  strToU8,
  unzip,
  zip,
  type AsyncZippable,
  type UnzipFileFilter,
} from "fflate"

const MANIFEST_PATH = "manifest.json"
const MAX_ARCHIVE_ENTRIES = 1_000
const MAX_ARCHIVE_BYTES = 128 * 1024 * 1024
const MAX_MANIFEST_BYTES = 2 * 1024 * 1024
const MAX_BINARY_ENTRY_BYTES = 3 * 1024 * 1024

export interface BackupArchiveEntry {
  path: string
  blob: Blob
}

export interface ParsedBackupArchive {
  manifest: unknown
  files: Map<string, Uint8Array>
}

export async function createBackupArchive(
  manifest: unknown,
  entries: readonly BackupArchiveEntry[]
) {
  const manifestBytes = strToU8(JSON.stringify(manifest))

  if (manifestBytes.byteLength > MAX_MANIFEST_BYTES) {
    throw new Error("Backup manifest is too large.")
  }

  const archive: AsyncZippable = {
    [MANIFEST_PATH]: [manifestBytes, { level: 6 }],
  }
  const seenPaths = new Set([MANIFEST_PATH])
  let totalBytes = manifestBytes.byteLength

  for (const entry of entries) {
    assertSafeArchivePath(entry.path)

    if (seenPaths.has(entry.path)) {
      throw new Error(`Backup contains a duplicate file: ${entry.path}`)
    }

    if (entry.blob.size > MAX_BINARY_ENTRY_BYTES) {
      throw new Error(`Backup attachment is too large: ${entry.path}`)
    }

    seenPaths.add(entry.path)
    totalBytes += entry.blob.size

    if (
      seenPaths.size > MAX_ARCHIVE_ENTRIES ||
      totalBytes > MAX_ARCHIVE_BYTES
    ) {
      throw new Error("Backup attachments exceed the supported size limit.")
    }

    archive[entry.path] = [
      new Uint8Array(await entry.blob.arrayBuffer()),
      { level: 0 },
    ]
  }

  return zipAsync(archive)
}

export async function parseBackupArchive(
  archiveBytes: Uint8Array
): Promise<ParsedBackupArchive> {
  const seenPaths = new Set<string>()
  let totalBytes = 0
  let validationError: Error | undefined
  const files = await unzipAsync(archiveBytes, (file) => {
    if (validationError) {
      return false
    }

    try {
      assertSafeArchivePath(file.name)

      if (seenPaths.has(file.name)) {
        throw new Error(`Backup contains a duplicate file: ${file.name}`)
      }

      const maxEntryBytes =
        file.name === MANIFEST_PATH
          ? MAX_MANIFEST_BYTES
          : MAX_BINARY_ENTRY_BYTES

      if (file.originalSize > maxEntryBytes) {
        throw new Error(`Backup file is too large: ${file.name}`)
      }

      seenPaths.add(file.name)
      totalBytes += file.originalSize

      if (
        seenPaths.size > MAX_ARCHIVE_ENTRIES ||
        totalBytes > MAX_ARCHIVE_BYTES
      ) {
        throw new Error("Backup archive exceeds the supported size limit.")
      }

      return true
    } catch (error) {
      validationError =
        error instanceof Error ? error : new Error("Backup archive is invalid.")
      return false
    }
  })

  if (validationError) {
    throw validationError
  }

  const manifestBytes = files[MANIFEST_PATH]

  if (!manifestBytes) {
    throw new Error("Backup archive is missing its manifest.")
  }

  let manifest: unknown

  try {
    manifest = JSON.parse(strFromU8(manifestBytes)) as unknown
  } catch {
    throw new Error("Backup manifest is not valid JSON.")
  }

  return {
    manifest,
    files: new Map(
      Object.entries(files).filter(([path]) => path !== MANIFEST_PATH)
    ),
  }
}

export function assertSafeArchivePath(path: string) {
  const segments = path.split("/")

  if (
    !path ||
    path.startsWith("/") ||
    path.includes("\\") ||
    /^[A-Za-z]:/.test(path) ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error(`Backup contains an unsafe file path: ${path || "(empty)"}`)
  }
}

function zipAsync(entries: AsyncZippable) {
  return new Promise<Uint8Array>((resolve, reject) => {
    zip(entries, { level: 0 }, (error, data) => {
      if (error) {
        reject(error)
        return
      }

      resolve(data)
    })
  })
}

function unzipAsync(
  data: Uint8Array,
  filter: UnzipFileFilter
) {
  return new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(data, { filter }, (error, files) => {
      if (error) {
        reject(error)
        return
      }

      resolve(files)
    })
  })
}

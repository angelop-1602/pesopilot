export type FilePermissionState = "granted" | "denied" | "prompt"

export interface BackupFilePermissionDescriptor {
  mode: "readwrite"
}

export interface BackupWritableFile {
  write: (data: Blob) => Promise<void>
  close: () => Promise<void>
}

export interface BackupFileHandle {
  createWritable: () => Promise<BackupWritableFile>
  queryPermission?: (
    descriptor: BackupFilePermissionDescriptor
  ) => Promise<FilePermissionState>
  requestPermission?: (
    descriptor: BackupFilePermissionDescriptor
  ) => Promise<FilePermissionState>
}

export interface BackupSaveFilePickerOptions {
  suggestedName: string
  types: Array<{
    description: string
    accept: Record<string, string[]>
  }>
}

export type BackupPickerWindow = Window & {
  showSaveFilePicker?: (
    options: BackupSaveFilePickerOptions
  ) => Promise<BackupFileHandle>
}

export interface AutomaticBackupStatus {
  supported: boolean
  enabled: boolean
  hasFileHandle: boolean
  lastBackupAt?: string
  lastError?: string
}

export interface AutomaticBackupWriteResult {
  wrote: boolean
  skippedReason?: "disabled" | "missing-file" | "missing-password"
  lastBackupAt?: string
}

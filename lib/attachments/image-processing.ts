export const MAX_IMAGE_INPUT_BYTES = 12 * 1024 * 1024
export const MAX_IMAGE_PIXELS = 40_000_000
export const MAX_IMAGE_LONG_EDGE = 2_048
export const MAX_IMAGE_OUTPUT_BYTES = 2 * 1024 * 1024
export const MAX_THUMBNAIL_LONG_EDGE = 320

export const SUPPORTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export type SupportedImageMimeType =
  (typeof SUPPORTED_IMAGE_MIME_TYPES)[number]

export type PreparedImageAttachment = {
  fileName: string
  mimeType: "image/jpeg" | "image/png" | "image/webp"
  sizeBytes: number
  width: number
  height: number
  blob: Blob
  thumbnailBlob: Blob
  thumbnailSizeBytes: number
}

export type ImageAttachmentErrorCode =
  | "empty-file"
  | "file-too-large"
  | "unsupported-format"
  | "type-mismatch"
  | "decode-failed"
  | "image-too-large"
  | "browser-unsupported"
  | "encode-failed"
  | "output-too-large"

export class ImageAttachmentError extends Error {
  readonly code: ImageAttachmentErrorCode

  constructor(code: ImageAttachmentErrorCode, message: string) {
    super(message)
    this.name = "ImageAttachmentError"
    this.code = code
  }
}

export type ContainedDimensions = {
  width: number
  height: number
}

export type UnsupportedImageFormat = "gif" | "heic" | "svg"

const OUTPUT_MIME_TYPE = "image/jpeg" as const
const OUTPUT_EXTENSION = ".jpg"
const HEADER_BYTES_TO_READ = 512
const MIN_MAIN_LONG_EDGE = MAX_THUMBNAIL_LONG_EDGE
const JPEG_QUALITY_STEPS = [0.86, 0.78, 0.7, 0.62, 0.54, 0.46]
const THUMBNAIL_QUALITY = 0.72
const DIMENSION_REDUCTION_FACTOR = 0.75

type BrowserCanvas = HTMLCanvasElement | OffscreenCanvas

type DecodedBrowserImage = {
  source: CanvasImageSource
  width: number
  height: number
  dispose: () => void
}

function asBytes(input: ArrayBuffer | Uint8Array): Uint8Array {
  return input instanceof Uint8Array ? input : new Uint8Array(input)
}

function hasBytesAt(
  bytes: Uint8Array,
  offset: number,
  expected: readonly number[]
): boolean {
  if (bytes.length < offset + expected.length) return false

  return expected.every((value, index) => bytes[offset + index] === value)
}

function readAscii(bytes: Uint8Array, start: number, length: number): string {
  let value = ""
  const end = Math.min(bytes.length, start + length)

  for (let index = start; index < end; index += 1) {
    value += String.fromCharCode(bytes[index])
  }

  return value
}

export function detectImageMimeType(
  input: ArrayBuffer | Uint8Array
): SupportedImageMimeType | undefined {
  const bytes = asBytes(input)

  if (hasBytesAt(bytes, 0, [0xff, 0xd8, 0xff])) return "image/jpeg"

  if (
    hasBytesAt(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ) {
    return "image/png"
  }

  if (
    readAscii(bytes, 0, 4) === "RIFF" &&
    readAscii(bytes, 8, 4) === "WEBP"
  ) {
    return "image/webp"
  }

  return undefined
}

export function detectUnsupportedImageFormat(
  input: ArrayBuffer | Uint8Array
): UnsupportedImageFormat | undefined {
  const bytes = asBytes(input)
  const signature = readAscii(bytes, 0, 6)

  if (signature === "GIF87a" || signature === "GIF89a") return "gif"

  if (readAscii(bytes, 4, 4) === "ftyp") {
    const heicBrands = new Set([
      "heic",
      "heix",
      "hevc",
      "hevx",
      "heim",
      "heis",
      "hevm",
      "hevs",
    ])

    for (let offset = 8; offset + 4 <= bytes.length; offset += 4) {
      if (heicBrands.has(readAscii(bytes, offset, 4))) return "heic"
    }
  }

  const textPrefix = readAscii(bytes, 0, Math.min(bytes.length, 512))
    .replace(/^\uFEFF/, "")
    .trimStart()

  if (/^(?:<\?xml[^>]*>\s*)?<svg(?:\s|>)/i.test(textPrefix)) return "svg"

  return undefined
}

function normalizeDeclaredMimeType(mimeType: string): string {
  const normalized = mimeType.trim().toLowerCase()
  if (normalized === "image/jpg" || normalized === "image/pjpeg") {
    return "image/jpeg"
  }

  return normalized
}

function getDeclaredUnsupportedFormat(
  mimeType: string
): UnsupportedImageFormat | undefined {
  if (mimeType === "image/gif") return "gif"
  if (mimeType === "image/svg+xml") return "svg"
  if (
    mimeType === "image/heic" ||
    mimeType === "image/heif" ||
    mimeType === "image/heic-sequence" ||
    mimeType === "image/heif-sequence"
  ) {
    return "heic"
  }

  return undefined
}

function unsupportedFormatMessage(format: UnsupportedImageFormat): string {
  const displayName = format === "heic" ? "HEIC" : format.toUpperCase()
  return `${displayName} images are not supported. Choose a JPEG, PNG, or WebP image.`
}

export function validateImageHeader(options: {
  bytes: ArrayBuffer | Uint8Array
  declaredMimeType?: string
}): SupportedImageMimeType {
  const declaredMimeType = normalizeDeclaredMimeType(
    options.declaredMimeType ?? ""
  )
  const declaredUnsupportedFormat = getDeclaredUnsupportedFormat(
    declaredMimeType
  )

  if (declaredUnsupportedFormat) {
    throw new ImageAttachmentError(
      "unsupported-format",
      unsupportedFormatMessage(declaredUnsupportedFormat)
    )
  }

  const actualMimeType = detectImageMimeType(options.bytes)
  if (!actualMimeType) {
    const unsupportedFormat = detectUnsupportedImageFormat(options.bytes)
    throw new ImageAttachmentError(
      "unsupported-format",
      unsupportedFormat
        ? unsupportedFormatMessage(unsupportedFormat)
        : "This image format is not supported. Choose a JPEG, PNG, or WebP image."
    )
  }

  const declaredTypeCanBeIgnored =
    declaredMimeType === "" || declaredMimeType === "application/octet-stream"

  if (!declaredTypeCanBeIgnored && declaredMimeType !== actualMimeType) {
    throw new ImageAttachmentError(
      "type-mismatch",
      "The file contents do not match its image type. Choose the original JPEG, PNG, or WebP file."
    )
  }

  return actualMimeType
}

export function calculateContainedDimensions(
  width: number,
  height: number,
  maxLongEdge: number
): ContainedDimensions {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(maxLongEdge) ||
    width <= 0 ||
    height <= 0 ||
    maxLongEdge <= 0
  ) {
    throw new RangeError("Image dimensions and maximum edge must be positive.")
  }

  const scale = Math.min(1, maxLongEdge / Math.max(width, height))

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export function getPreparedImageFileName(fileName: string): string {
  const safeName = fileName.replace(/[\\/]/g, "_").trim()
  const lastDotIndex = safeName.lastIndexOf(".")
  const baseName = (
    lastDotIndex > 0 ? safeName.slice(0, lastDotIndex) : safeName
  ).trim()

  return `${baseName || "attachment"}${OUTPUT_EXTENSION}`
}

function assertInputSize(file: File): void {
  if (file.size === 0) {
    throw new ImageAttachmentError(
      "empty-file",
      "This image is empty. Choose a different JPEG, PNG, or WebP image."
    )
  }

  if (file.size > MAX_IMAGE_INPUT_BYTES) {
    throw new ImageAttachmentError(
      "file-too-large",
      "This image is larger than 12 MB. Choose a smaller JPEG, PNG, or WebP image."
    )
  }
}

function assertDecodedDimensions(width: number, height: number): void {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new ImageAttachmentError(
      "decode-failed",
      "This image could not be read. It may be damaged or incomplete."
    )
  }

  if (width > MAX_IMAGE_PIXELS / height) {
    throw new ImageAttachmentError(
      "image-too-large",
      "This image contains more than 40 megapixels. Choose a smaller image."
    )
  }
}

async function decodeWithImageBitmap(file: File): Promise<DecodedBrowserImage> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  })

  return {
    source: bitmap,
    width: bitmap.width,
    height: bitmap.height,
    dispose: () => bitmap.close(),
  }
}

async function decodeWithImageElement(file: File): Promise<DecodedBrowserImage> {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw new ImageAttachmentError(
      "browser-unsupported",
      "Image processing is not supported in this browser."
    )
  }

  const objectUrl = URL.createObjectURL(file)
  const image = document.createElement("img")
  image.decoding = "async"

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error("Image decode failed."))
      image.src = objectUrl
    })

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      dispose: () => {
        image.onload = null
        image.onerror = null
        image.removeAttribute("src")
        URL.revokeObjectURL(objectUrl)
      },
    }
  } catch (error) {
    image.onload = null
    image.onerror = null
    image.removeAttribute("src")
    URL.revokeObjectURL(objectUrl)
    throw error
  }
}

async function decodeImage(file: File): Promise<DecodedBrowserImage> {
  if (typeof createImageBitmap === "function") {
    try {
      return await decodeWithImageBitmap(file)
    } catch {
      // Some browsers support this API but cannot decode every supported format.
    }
  }

  try {
    return await decodeWithImageElement(file)
  } catch {
    if (
      typeof createImageBitmap !== "function" &&
      typeof document === "undefined"
    ) {
      throw new ImageAttachmentError(
        "browser-unsupported",
        "Image processing is not supported in this browser."
      )
    }

    throw new ImageAttachmentError(
      "decode-failed",
      "This image could not be read. It may be damaged or incomplete."
    )
  }
}

function createCanvas(width: number, height: number): BrowserCanvas {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height)
  }

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    return canvas
  }

  throw new ImageAttachmentError(
    "browser-unsupported",
    "Image processing is not supported in this browser."
  )
}

function drawImage(
  source: CanvasImageSource,
  width: number,
  height: number
): BrowserCanvas {
  const canvas = createCanvas(width, height)
  const context = canvas.getContext("2d")

  if (!context) {
    releaseCanvas(canvas)
    throw new ImageAttachmentError(
      "browser-unsupported",
      "Image processing is not supported in this browser."
    )
  }

  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, width, height)
  context.drawImage(source, 0, 0, width, height)

  return canvas
}

async function canvasToJpeg(
  canvas: BrowserCanvas,
  quality: number
): Promise<Blob> {
  let blob: Blob | null

  if ("convertToBlob" in canvas) {
    try {
      blob = await canvas.convertToBlob({
        type: OUTPUT_MIME_TYPE,
        quality,
      })
    } catch {
      throw new ImageAttachmentError(
        "encode-failed",
        "This image could not be prepared. Choose a different image."
      )
    }
  } else {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, OUTPUT_MIME_TYPE, quality)
    })
  }

  if (!blob || blob.size === 0 || blob.type !== OUTPUT_MIME_TYPE) {
    throw new ImageAttachmentError(
      "encode-failed",
      "This browser could not create a compatible JPEG image."
    )
  }

  return blob
}

function releaseCanvas(canvas: BrowserCanvas): void {
  canvas.width = 1
  canvas.height = 1
}

async function encodeMainImage(
  decoded: DecodedBrowserImage
): Promise<{ blob: Blob; width: number; height: number }> {
  let maxLongEdge = Math.min(
    MAX_IMAGE_LONG_EDGE,
    Math.max(decoded.width, decoded.height)
  )

  while (true) {
    const dimensions = calculateContainedDimensions(
      decoded.width,
      decoded.height,
      maxLongEdge
    )
    const canvas = drawImage(decoded.source, dimensions.width, dimensions.height)

    try {
      for (const quality of JPEG_QUALITY_STEPS) {
        const blob = await canvasToJpeg(canvas, quality)
        if (blob.size <= MAX_IMAGE_OUTPUT_BYTES) {
          return { blob, ...dimensions }
        }
      }
    } finally {
      releaseCanvas(canvas)
    }

    const currentLongEdge = Math.max(dimensions.width, dimensions.height)
    if (currentLongEdge <= MIN_MAIN_LONG_EDGE) break

    maxLongEdge = Math.max(
      MIN_MAIN_LONG_EDGE,
      Math.floor(currentLongEdge * DIMENSION_REDUCTION_FACTOR)
    )
  }

  throw new ImageAttachmentError(
    "output-too-large",
    "This image could not be reduced below 2 MB. Choose a smaller image."
  )
}

async function encodeThumbnail(decoded: DecodedBrowserImage): Promise<Blob> {
  const dimensions = calculateContainedDimensions(
    decoded.width,
    decoded.height,
    MAX_THUMBNAIL_LONG_EDGE
  )
  const canvas = drawImage(decoded.source, dimensions.width, dimensions.height)

  try {
    return await canvasToJpeg(canvas, THUMBNAIL_QUALITY)
  } finally {
    releaseCanvas(canvas)
  }
}

export async function prepareImageAttachment(
  file: File
): Promise<PreparedImageAttachment> {
  assertInputSize(file)

  const header = await file.slice(0, HEADER_BYTES_TO_READ).arrayBuffer()
  validateImageHeader({ bytes: header, declaredMimeType: file.type })

  let decoded: DecodedBrowserImage
  try {
    decoded = await decodeImage(file)
  } catch (error) {
    if (error instanceof ImageAttachmentError) throw error
    throw new ImageAttachmentError(
      "decode-failed",
      "This image could not be read. It may be damaged or incomplete."
    )
  }

  try {
    assertDecodedDimensions(decoded.width, decoded.height)

    const main = await encodeMainImage(decoded)
    const thumbnailBlob = await encodeThumbnail(decoded)

    return {
      fileName: getPreparedImageFileName(file.name),
      mimeType: OUTPUT_MIME_TYPE,
      sizeBytes: main.blob.size,
      width: main.width,
      height: main.height,
      blob: main.blob,
      thumbnailBlob,
      thumbnailSizeBytes: thumbnailBlob.size,
    }
  } finally {
    decoded.dispose()
  }
}

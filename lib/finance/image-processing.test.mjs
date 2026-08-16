import assert from "node:assert/strict"
import { test } from "node:test"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, { tsconfigPaths: true })
const {
  ImageAttachmentError,
  calculateContainedDimensions,
  detectImageMimeType,
  detectUnsupportedImageFormat,
  getPreparedImageFileName,
  validateImageHeader,
} = jiti("../attachments/image-processing.ts")

test("supported image formats are detected from magic bytes", () => {
  const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])
  const png = Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ])
  const webp = Uint8Array.from([
    0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
  ])

  assert.equal(detectImageMimeType(jpeg), "image/jpeg")
  assert.equal(detectImageMimeType(png), "image/png")
  assert.equal(detectImageMimeType(webp), "image/webp")
  assert.equal(detectImageMimeType(Uint8Array.from([1, 2, 3])), undefined)
})

test("unsupported GIF, SVG, and HEIC formats receive clear errors", () => {
  const gif = new TextEncoder().encode("GIF89a")
  const svg = new TextEncoder().encode(
    '<?xml version="1.0"?>\n<svg viewBox="0 0 10 10"></svg>'
  )
  const heic = new Uint8Array(24)
  heic.set(new TextEncoder().encode("ftyp"), 4)
  heic.set(new TextEncoder().encode("heic"), 8)

  assert.equal(detectUnsupportedImageFormat(gif), "gif")
  assert.equal(detectUnsupportedImageFormat(svg), "svg")
  assert.equal(detectUnsupportedImageFormat(heic), "heic")

  for (const [bytes, format] of [
    [gif, "GIF"],
    [svg, "SVG"],
    [heic, "HEIC"],
  ]) {
    assert.throws(
      () => validateImageHeader({ bytes }),
      (error) =>
        error instanceof ImageAttachmentError &&
        error.code === "unsupported-format" &&
        error.message.includes(format)
    )
  }
})

test("declared image types must agree with file contents", () => {
  const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])

  assert.equal(
    validateImageHeader({ bytes: jpeg, declaredMimeType: "image/jpg" }),
    "image/jpeg"
  )
  assert.equal(
    validateImageHeader({
      bytes: jpeg,
      declaredMimeType: "application/octet-stream",
    }),
    "image/jpeg"
  )
  assert.throws(
    () => validateImageHeader({ bytes: jpeg, declaredMimeType: "image/png" }),
    (error) =>
      error instanceof ImageAttachmentError && error.code === "type-mismatch"
  )
})

test("contained dimensions preserve aspect ratio without enlarging", () => {
  assert.deepEqual(calculateContainedDimensions(4_000, 3_000, 2_048), {
    width: 2_048,
    height: 1_536,
  })
  assert.deepEqual(calculateContainedDimensions(3_000, 4_000, 320), {
    width: 240,
    height: 320,
  })
  assert.deepEqual(calculateContainedDimensions(200, 100, 320), {
    width: 200,
    height: 100,
  })
  assert.throws(
    () => calculateContainedDimensions(0, 100, 320),
    /must be positive/
  )
})

test("prepared filenames are safe and use the encoded JPEG extension", () => {
  assert.equal(getPreparedImageFileName("receipt.PNG"), "receipt.jpg")
  assert.equal(getPreparedImageFileName("folder/photo.webp"), "folder_photo.jpg")
  assert.equal(getPreparedImageFileName("  "), "attachment.jpg")
})

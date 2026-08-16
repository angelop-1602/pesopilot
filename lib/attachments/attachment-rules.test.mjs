import assert from "node:assert/strict"
import { test } from "node:test"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, { tsconfigPaths: true })
const {
  isAttachmentPurposeValidForOwner,
  isSingleAttachmentPurpose,
} = jiti("./attachment-rules.ts")

test("owner-specific attachment purposes reject unrelated records", () => {
  assert.equal(
    isAttachmentPurposeValidForOwner("transaction", "receipt"),
    true
  )
  assert.equal(
    isAttachmentPurposeValidForOwner("transaction", "payment_proof"),
    true
  )
  assert.equal(isAttachmentPurposeValidForOwner("bill", "payment_proof"), false)
  assert.equal(isAttachmentPurposeValidForOwner("bill", "bill_document"), true)
  assert.equal(isAttachmentPurposeValidForOwner("bill", "receipt"), false)
  assert.equal(
    isAttachmentPurposeValidForOwner("profile", "profile_image"),
    true
  )
  assert.equal(
    isAttachmentPurposeValidForOwner("account", "profile_image"),
    false
  )
  assert.equal(isAttachmentPurposeValidForOwner("goal", "other"), true)
})

test("cover and identity images are singleton purposes", () => {
  assert.equal(isSingleAttachmentPurpose("account_image"), true)
  assert.equal(isSingleAttachmentPurpose("goal_cover"), true)
  assert.equal(isSingleAttachmentPurpose("profile_image"), true)
  assert.equal(isSingleAttachmentPurpose("receipt"), false)
  assert.equal(isSingleAttachmentPurpose("bill_document"), false)
})

import type {
  AttachmentOwnerType,
  AttachmentPurpose,
} from "@/types/finance"

const SINGLE_ATTACHMENT_PURPOSES = new Set<AttachmentPurpose>([
  "account_image",
  "goal_cover",
  "profile_image",
])

const PURPOSE_OWNERS: Record<
  Exclude<AttachmentPurpose, "other">,
  readonly AttachmentOwnerType[]
> = {
  receipt: ["transaction"],
  payment_proof: ["transaction"],
  bill_document: ["bill"],
  account_image: ["account"],
  goal_cover: ["goal"],
  profile_image: ["profile"],
}

export function isSingleAttachmentPurpose(purpose: AttachmentPurpose) {
  return SINGLE_ATTACHMENT_PURPOSES.has(purpose)
}

export function isAttachmentPurposeValidForOwner(
  ownerType: AttachmentOwnerType,
  purpose: AttachmentPurpose
) {
  return purpose === "other" || PURPOSE_OWNERS[purpose].includes(ownerType)
}

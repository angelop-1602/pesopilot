import { z } from "zod"

import {
  accountSchema,
  billSchema,
  budgetSchema,
  categorySchema,
  goalSchema,
  settingsSchema,
  transactionSchema,
} from "@/lib/finance/validators"

export const backupSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  app: z.literal("PesoPilot"),
  data: z.object({
    accounts: z.array(accountSchema),
    categories: z.array(categorySchema),
    transactions: z.array(transactionSchema),
    budgets: z.array(budgetSchema),
    goals: z.array(goalSchema),
    bills: z.array(billSchema),
    settings: z.array(settingsSchema),
  }),
})

const attachmentOwnerSchema = z.enum([
  "account",
  "transaction",
  "bill",
  "goal",
  "profile",
])
const attachmentPurposeSchema = z.enum([
  "receipt",
  "payment_proof",
  "bill_document",
  "account_image",
  "goal_cover",
  "profile_image",
  "other",
])
const backupAttachmentSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),
  ownerType: attachmentOwnerSchema,
  ownerId: z.string().min(1),
  purpose: attachmentPurposeSchema,
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z.number().int().positive().max(2 * 1024 * 1024),
  width: z.number().int().positive().max(10_000),
  height: z.number().int().positive().max(10_000),
  thumbnailMimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  thumbnailSizeBytes: z.number().int().positive().max(512 * 1024),
  originalPath: z.string().min(1),
  thumbnailPath: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const currentBackupSchema = z.object({
  schemaVersion: z.literal(2),
  exportedAt: z.string(),
  app: z.literal("PesoPilot"),
  data: z.object({
    accounts: z.array(accountSchema),
    categories: z.array(categorySchema),
    transactions: z.array(transactionSchema),
    budgets: z.array(budgetSchema),
    goals: z.array(goalSchema),
    bills: z.array(billSchema),
    settings: z.array(settingsSchema),
    attachments: z.array(backupAttachmentSchema).max(499),
  }),
})

export const supportedBackupSchema = z.discriminatedUnion("schemaVersion", [
  backupSchema,
  currentBackupSchema,
])

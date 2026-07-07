import { z } from "zod"

export const idSchema = z.string().min(1)

export const accountSchema = z.object({
  id: idSchema,
  name: z.string().min(1).optional(),
  type: z.enum([
    "cash",
    "bank",
    "digital_bank",
    "ewallet",
    "investment",
    "debt",
    "savings",
    "credit",
    "loan",
  ]).optional(),
  iconKey: z.string().optional(),
  institutionKey: z.string().optional(),
  institutionName: z.string().optional(),
  institutionCategory: z.enum([
    "cash",
    "bank",
    "digital_bank",
    "ewallet",
    "investment_platform",
    "other",
  ]).optional(),
  accountProductType: z.enum([
    "cash",
    "wallet",
    "savings",
    "checking",
    "credit_card",
    "loan",
    "investment",
    "time_deposit",
    "emergency_fund",
    "other",
  ]).optional(),
  balanceNature: z.enum(["asset", "liability"]).optional(),
  displayName: z.string().optional(),
  customDisplayName: z.string().optional(),
  logoAsset: z.string().optional(),
  logoText: z.string().optional(),
  notes: z.string().optional(),
  openingBalanceCentavos: z.number().int(),
  balanceCentavos: z.number().int(),
  currency: z.literal("PHP").optional(),
  includeInNetWorth: z.boolean(),
  color: z.string().min(1).optional(),
  creditLimitCentavos: z.number().int().optional(),
  statementDay: z.number().int().min(1).max(31).optional(),
  paymentDueDay: z.number().int().min(1).max(31).optional(),
  lastStatementDate: z.string().optional(),
  currentStatementBalanceCentavos: z.number().int().optional(),
  availableCreditCentavos: z.number().int().optional(),
  archived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).passthrough()

export const categorySchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  kind: z.enum(["income", "expense"]),
  color: z.string().min(1),
  system: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const transactionSchema = z
  .object({
    id: idSchema,
    type: z.enum(["income", "expense", "transfer"]),
    amountCentavos: z.number().int().positive(),
    accountId: idSchema,
    transferAccountId: z.string().optional(),
    categoryId: z.string().optional(),
    billId: z.string().optional(),
    date: z.string().min(10),
    description: z.string().min(1),
    notes: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .refine(
    (transaction) =>
      transaction.type !== "transfer" ||
      (transaction.transferAccountId &&
        transaction.transferAccountId !== transaction.accountId),
    "Transfers need a different destination account."
  )

export const budgetSchema = z.object({
  id: idSchema,
  monthId: z.string().regex(/^\d{4}-\d{2}$/),
  categoryId: idSchema,
  limitCentavos: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const goalSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  targetCentavos: z.number().int().positive(),
  currentCentavos: z.number().int().nonnegative(),
  targetDate: z.string().optional(),
  linkedAccountId: z.string().optional(),
  status: z.enum(["active", "paused", "completed"]),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const billSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  amountCentavos: z.number().int().positive(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  dueDay: z.number().int().min(1).max(31),
  frequency: z.enum(["monthly", "weekly", "yearly"]),
  autopay: z.boolean(),
  active: z.boolean(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const settingsSchema = z.object({
  id: idSchema,
  appName: z.string().min(1),
  displayName: z.string().optional(),
  currency: z.literal("PHP"),
  locale: z.literal("en-PH"),
  timezone: z.literal("Asia/Manila"),
  budgetMethod: z.enum(["zero-based", "fifty-thirty-twenty", "envelope"]),
  showInstallTips: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

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

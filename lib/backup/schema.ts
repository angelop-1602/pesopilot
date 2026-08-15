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

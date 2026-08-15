import type {
  AccountProductType,
  Id,
  InstitutionKey,
} from "@/types/finance"

export interface AccountFormValues {
  id?: Id
  institutionKey: InstitutionKey
  accountProductType: AccountProductType
  openingBalance: string
  creditLimit?: string
  statementDay?: number
  paymentDueDay?: number
  includeInNetWorth: boolean
  allowOverLimit?: boolean
}

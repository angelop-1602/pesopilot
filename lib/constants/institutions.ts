import type {
  AccountProductType,
  InstitutionCategory,
  InstitutionKey,
} from "@/types/finance"

export type InstitutionOption = {
  key: InstitutionKey
  name: string
  shortName?: string
  institutionCategory: InstitutionCategory
  logoText?: string
  logoAsset?: string
  color: string
  textColor?: string
  allowedAccountProductTypes: AccountProductType[]
  defaultAccountProductType: AccountProductType
}

const bankProducts: AccountProductType[] = [
  "savings",
  "checking",
  "credit_card",
  "loan",
  "investment",
  "time_deposit",
]

export const institutions: InstitutionOption[] = [
  {
    key: "cash",
    name: "Cash",
    shortName: "Cash",
    institutionCategory: "cash",
    color: "#15803d",
    allowedAccountProductTypes: ["cash"],
    defaultAccountProductType: "cash",
  },
  {
    key: "gcash",
    name: "GCash",
    shortName: "GCash",
    institutionCategory: "ewallet",
    logoText: "G",
    color: "#007dff",
    allowedAccountProductTypes: ["wallet", "savings"],
    defaultAccountProductType: "wallet",
  },
  {
    key: "maya",
    name: "Maya",
    shortName: "Maya",
    institutionCategory: "digital_bank",
    logoText: "M",
    color: "#00a651",
    allowedAccountProductTypes: ["wallet", "savings", "credit_card"],
    defaultAccountProductType: "wallet",
  },
  {
    key: "gotyme",
    name: "GoTyme",
    shortName: "GoTyme",
    institutionCategory: "digital_bank",
    logoText: "GT",
    color: "#00aeef",
    textColor: "#052f35",
    allowedAccountProductTypes: ["savings"],
    defaultAccountProductType: "savings",
  },
  {
    key: "seabank",
    name: "SeaBank",
    shortName: "SeaBank",
    institutionCategory: "digital_bank",
    logoText: "S",
    color: "#f05a28",
    allowedAccountProductTypes: ["savings"],
    defaultAccountProductType: "savings",
  },
  {
    key: "cimb",
    name: "CIMB Bank PH",
    shortName: "CIMB",
    institutionCategory: "digital_bank",
    logoText: "C",
    color: "#8a1538",
    allowedAccountProductTypes: ["savings", "time_deposit"],
    defaultAccountProductType: "savings",
  },
  {
    key: "tonik",
    name: "Tonik",
    shortName: "Tonik",
    institutionCategory: "digital_bank",
    logoText: "T",
    color: "#ec008c",
    allowedAccountProductTypes: ["savings", "time_deposit"],
    defaultAccountProductType: "savings",
  },
  {
    key: "bpi",
    name: "BPI",
    shortName: "BPI",
    institutionCategory: "bank",
    logoText: "BPI",
    color: "#b11116",
    allowedAccountProductTypes: bankProducts,
    defaultAccountProductType: "savings",
  },
  {
    key: "bdo",
    name: "BDO",
    shortName: "BDO",
    institutionCategory: "bank",
    logoText: "BDO",
    color: "#003da5",
    allowedAccountProductTypes: bankProducts,
    defaultAccountProductType: "savings",
  },
  {
    key: "metrobank",
    name: "Metrobank",
    shortName: "Metrobank",
    institutionCategory: "bank",
    logoText: "MB",
    color: "#034ea2",
    allowedAccountProductTypes: bankProducts,
    defaultAccountProductType: "savings",
  },
  {
    key: "landbank",
    name: "LandBank",
    shortName: "LandBank",
    institutionCategory: "bank",
    logoText: "LB",
    color: "#1b5e20",
    allowedAccountProductTypes: bankProducts,
    defaultAccountProductType: "savings",
  },
  {
    key: "rcbc",
    name: "RCBC",
    shortName: "RCBC",
    institutionCategory: "bank",
    logoText: "RCBC",
    color: "#005baa",
    allowedAccountProductTypes: bankProducts,
    defaultAccountProductType: "savings",
  },
  {
    key: "unionbank",
    name: "UnionBank",
    shortName: "UnionBank",
    institutionCategory: "bank",
    logoText: "UB",
    color: "#f58220",
    textColor: "#1f2937",
    allowedAccountProductTypes: bankProducts,
    defaultAccountProductType: "savings",
  },
  {
    key: "security_bank",
    name: "Security Bank",
    shortName: "Security Bank",
    institutionCategory: "bank",
    logoText: "SB",
    color: "#005eb8",
    allowedAccountProductTypes: bankProducts,
    defaultAccountProductType: "savings",
  },
  {
    key: "pnb",
    name: "PNB",
    shortName: "PNB",
    institutionCategory: "bank",
    logoText: "PNB",
    color: "#003f88",
    allowedAccountProductTypes: bankProducts,
    defaultAccountProductType: "savings",
  },
  {
    key: "chinabank",
    name: "China Bank",
    shortName: "China Bank",
    institutionCategory: "bank",
    logoText: "CB",
    color: "#d71920",
    allowedAccountProductTypes: bankProducts,
    defaultAccountProductType: "savings",
  },
  {
    key: "other",
    name: "Other",
    shortName: "Other",
    institutionCategory: "other",
    color: "#475569",
    allowedAccountProductTypes: [
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
    ],
    defaultAccountProductType: "savings",
  },
]

export const DEFAULT_INSTITUTION_KEY: InstitutionKey = "cash"
export const FALLBACK_INSTITUTION_KEY: InstitutionKey = "other"

export function getInstitution(key?: string) {
  return (
    institutions.find((institution) => institution.key === key) ??
    institutions.find(
      (institution) => institution.key === FALLBACK_INSTITUTION_KEY
    )!
  )
}

export function getDefaultInstitution() {
  return getInstitution(DEFAULT_INSTITUTION_KEY)
}

export function getAccountInstitution(account: {
  color?: string
  institutionKey?: string
  institutionName?: string
  logoAsset?: string
  logoText?: string
}) {
  const institution = getInstitution(account.institutionKey)

  return {
    ...institution,
    color: account.color ?? institution.color,
    logoAsset: account.logoAsset ?? institution.logoAsset,
    logoText: account.logoText ?? institution.logoText,
    name: account.institutionName ?? institution.name,
  }
}

export function isAccountProductAllowed(
  institution: InstitutionOption,
  productType: AccountProductType
) {
  return institution.allowedAccountProductTypes.includes(productType)
}

export type { InstitutionCategory, InstitutionKey }

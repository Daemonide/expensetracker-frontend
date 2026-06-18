import * as React from "react"
import {
  IconBuildingBank,
  IconCreditCard,
  IconWallet,
  IconQrcode,
  IconCashBanknote,
} from "@tabler/icons-react"

export type FinancialAccountType = "BANK" | "CREDIT" | "DEBIT" | "UPI" | "CASH"

interface AccountTypeConfig {
  label: string
  icon: React.ElementType
  // solid color — used for the vertical band on account/expense cards
  bandClass: string
  // soft bg + text — used for chips, badges, select items
  chipClass: string
}

export const ACCOUNT_TYPE_CONFIG: Record<FinancialAccountType, AccountTypeConfig> = {
  BANK: {
    label: "Bank",
    icon: IconBuildingBank,
    bandClass: "bg-blue-500",
    chipClass: "bg-blue-500/10 text-blue-500",
  },
  CREDIT: {
    label: "Credit Card",
    icon: IconCreditCard,
    bandClass: "bg-purple-500",
    chipClass: "bg-purple-500/10 text-purple-500",
  },
  DEBIT: {
    label: "Debit Card",
    icon: IconWallet,
    bandClass: "bg-pink-500",
    chipClass: "bg-pink-500/10 text-pink-500",
  },
  UPI: {
    label: "UPI",
    icon: IconQrcode,
    bandClass: "bg-amber-500",
    chipClass: "bg-amber-500/10 text-amber-500",
  },
  CASH: {
    label: "Cash",
    icon: IconCashBanknote,
    bandClass: "bg-emerald-500",
    chipClass: "bg-emerald-500/10 text-emerald-500",
  },
}

export const ACCOUNT_TYPE_OPTIONS = Object.keys(
  ACCOUNT_TYPE_CONFIG
) as FinancialAccountType[]

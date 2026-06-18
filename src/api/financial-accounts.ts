import api from "./axios"
import type { FinancialAccountType } from "@/lib/account-types"

export interface FinancialAccount {
  id: number
  name: string
  type: FinancialAccountType
}

export interface FinancialAccountForm {
  name: string
  type: FinancialAccountType
}

export const getFinancialAccounts = async (): Promise<FinancialAccount[]> => {
  const response = await api.get<FinancialAccount[]>("/financial-accounts")
  return response.data
}

export const getFinancialAccountById = (id: number) =>
  api.get<FinancialAccount>(`/financial-accounts/${id}`).then((r) => r.data)

export const createFinancialAccount = (data: FinancialAccountForm) =>
  api.post<FinancialAccount>("/financial-accounts", data).then((r) => r.data)

export const updateFinancialAccount = (
  id: number,
  data: FinancialAccountForm
) =>
  api
    .put<FinancialAccount>(`/financial-accounts/${id}`, data)
    .then((r) => r.data)

export const deleteFinancialAccount = (id: number) =>
  api.delete(`/financial-accounts/${id}`)

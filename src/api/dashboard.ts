import api from "./axios"
import type { Expense } from "./expenses"

export interface MonthlyTrend {
  month: string
  amount: number
}

export interface CategorySummary {
  category: string
  amount: number
}

export interface StatusSummary {
  status: string
  count: number
  amount: number
}

export interface DashboardResponse {
  totalSpent: number
  thisMonthSpent: number
  pendingAmount: number
  completedAmount: number

  totalExpenses: number
  thisMonthExpenses: number
  pendingExpenses: number
  completedExpenses: number

  monthlyTrend: MonthlyTrend[]
  categorySummary: CategorySummary[]
  statusSummary: StatusSummary[]

  recentExpenses: Expense[]
}

export const getDashboard = () =>
  api.get<DashboardResponse>("/dashboard").then((r) => r.data)

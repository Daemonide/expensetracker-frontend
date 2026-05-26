import api from "./axios"

export type ExpenseStatus = "DONE" | "IN_PROGRESS" | "PENDING" | "CANCELLED"

export interface Expense {
  expenseID: number
  title: string
  amount: number
  date: string
  categoryId: number
  categoryName: string
  status: ExpenseStatus
}

export interface ExpenseForm {
  title: string
  amount: number
  date: string
  categoryId: number
  status: ExpenseStatus
}

export interface ExpenseResponse {
  content: Expense[]
  totalPages: number
  totalElements: number
  size: number
  page: number
  empty: boolean
  sortField: string
  sortDirection: string
}

export const getExpenses = async (
  page = 1,
  size = 10,
  sortField = "date",
  sortDirection = "DESC"
) => {
  const response = await api.get("/expenses", {
    params: {
      page,
      size,
      sortField,
      sortDirection,
    },
  })

  return response.data
}

export const getExpenseById = (id: number) =>
  api.get<Expense>(`/expenses/${id}`).then((r) => r.data)

export const createExpense = (data: ExpenseForm) =>
  api.post<Expense>("/expenses", data).then((r) => r.data)

export const updateExpense = (id: number, data: ExpenseForm) =>
  api.put<Expense>(`/expenses/${id}`, data).then((r) => r.data)

export const deleteExpense = (id: number) => api.delete(`/expenses/${id}`)

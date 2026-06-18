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
  financialAccountId: number
  financialAccountName: string
}

export interface ExpenseForm {
  title: string
  amount: number
  date: string
  categoryId: number
  status: ExpenseStatus
  financialAccountId: number
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

export interface ExpenseQueryParams {
  page?: number
  size?: number
  sortField?: string
  sortDirection?: string
  search?: string
  status?: string
  categoryId?: number
  financialAccountId?: number
  dateFrom?: string
  dateTo?: string
}

export const getExpenses = async (
  params: ExpenseQueryParams = {}
): Promise<ExpenseResponse> => {
  const {
    page = 0,
    size = 10,
    sortField = "date",
    sortDirection = "DESC",
    search = "",
    status,
    categoryId,
    financialAccountId,
    dateFrom,
    dateTo,
  } = params

  const response = await api.get("/expenses", {
    params: {
      page,
      size,
      sortField,
      sortDirection,
      ...(search.trim() && { search: search.trim() }),
      ...(status && { status }),
      ...(categoryId && { categoryId }),
      ...(financialAccountId && { financialAccountId }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
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

import api from "./axios"
import type { PaginatedResponse } from "@/types/pagination"

export interface Category {
  categoryId: number
  name: string
}

export interface CategoryForm {
  name: string
}

export interface CategoryQueryParams {
  page?: number
  size?: number
  sortField?: string
  sortDirection?: "ASC" | "DESC"
  search?: string
}

export const getCategories = (params: CategoryQueryParams = {}) => {
  const {
    page = 0,
    size = 999,
    sortField = "id",
    sortDirection = "ASC",
    search,
  } = params

  return api
    .get<PaginatedResponse<Category>>("/categories", {
      params: {
        page,
        size,
        sortField,
        sortDirection,
        ...(search?.trim() && { search: search.trim() }),
      },
    })
    .then((r) => r.data)
}

export const getCategoryById = (id: number) =>
  api.get<Category>(`/categories/${id}`).then((r) => r.data)

export const createCategory = (data: CategoryForm) =>
  api.post<Category>("/categories", data).then((r) => r.data)

export const updateCategory = (id: number, data: CategoryForm) =>
  api.put<Category>(`/categories/${id}`, data).then((r) => r.data)

export const deleteCategory = (id: number) => api.delete(`/categories/${id}`)

import api from "./axios"

export interface Category {
  categoryId: number
  name: string
}

export interface CategoryForm {
  name: string
}

export const getCategories = () =>
  api.get<Category[]>("/categories").then((r) => r.data)

export const getCategoryById = (id: number) =>
  api.get<Category>(`/categories/${id}`).then((r) => r.data)

export const createCategory = (data: CategoryForm) =>
  api.post<Category>("/categories", data).then((r) => r.data)

export const updateCategory = (id: number, data: CategoryForm) =>
  api.put<Category>(`/categories/${id}`, data).then((r) => r.data)

export const deleteCategory = (id: number) => api.delete(`/categories/${id}`)

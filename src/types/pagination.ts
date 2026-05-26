export interface PagingResult<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  page: number
  empty: boolean
  sortField: string
  sortDirection: string
}

export interface PaginationParams {
  page?: number
  size?: number
  sortField?: string
  direction?: "ASC" | "DESC"
  fetchAll?: boolean
}

export interface PaginatedResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  page: number
  empty: boolean
  sortField?: string
  sortDirection?: string
}

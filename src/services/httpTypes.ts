export type ApiResponse<T> = {
  message: string
  data: T
}

export type PaginationMeta = {
  page: number
  limit: number
  total: number
}

export type PaginatedApiResponse<T> = ApiResponse<T> & {
  meta: PaginationMeta
}

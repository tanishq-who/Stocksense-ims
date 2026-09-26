export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DeliveryFilterParams {
  search?: string;
  status?: string;
  warehouse?: string;
  page?: number;
  pageSize?: number;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  detail?: string;
}

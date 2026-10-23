export interface ApiResponse<T> {
  message: string;
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  message?: string;
  success?: boolean;
  errors?: Record<string, string>;
}
// Mirrors common/response/PageResponse on the backend.
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

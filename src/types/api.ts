/**
 * ApiResponse - standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * PaginationParams - standard pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * PaginatedResponse - standard paginated response format
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * SearchParams - standard search parameters
 */
export interface SearchParams extends PaginationParams {
  search?: string;
  sort?: string;
  category?: string;
  period?: string;
  type?: string;
} 
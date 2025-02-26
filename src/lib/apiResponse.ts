// Standard API response format
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
}

// Helper functions to create consistent API responses
export const successResponse = <T>(data: T, message = "Success", statusCode: number): ApiResponse<T> => ({
  success: true,
  data,
  message,
  statusCode
});

export const errorResponse = (error: string, statusCode: number): ApiResponse => ({
  success: false,
  error,
  statusCode
}); 
import axios from "axios";
import { BACKEND_BASE_URL } from "./routes";
import { ApiResponse } from "@/lib/apiResponse";

// Create an axios instance with interceptors
export const api = axios.create({
  baseURL: BACKEND_BASE_URL || "",
  withCredentials: true, // Enable cookies for all requests
});

// Add a request interceptor to automatically add the token to all requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the Authorization header
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    } 
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If there's no response, it's likely a network error
    if (!error.response) {
      console.error("Network error:", error.message);
      // Don't show toast for validation requests to avoid spam
      if (!originalRequest.url.includes('/api/auth/validate')) {
        console.error("Network error. Please check your connection.");
      }
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized errors
    if (error.response.status === 401) {
      console.log("401 Unauthorized error detected");
      
      // For validation requests, never retry - just fail cleanly
      if (originalRequest.url.includes('/api/auth/validate')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return Promise.reject(error);
      }
      
      // If this is already a retry, don't retry again
      if (originalRequest._retry) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login if needed
        if (typeof window !== 'undefined' && 
            !window.location.pathname.includes('/login') &&
            !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }
      
      // Mark as retry attempt
      originalRequest._retry = true;
      
      try {
        console.log("Retrying request with existing token");
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Error refreshing auth:", refreshError);
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (typeof window !== 'undefined' && 
            !window.location.pathname.includes('/login') &&
            !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

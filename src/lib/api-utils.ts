import { toast } from "sonner";

export const handleApiError = (error: any, fallback: any = null) => {
  console.error("API Error:", error);
  
  let message = "An unexpected error occurred";
  
  if (error.response) {
    // Server responded with a non-2xx status code
    message = error.response.data?.error || `Error: ${error.response.status}`;
  } else if (error.request) {
    // Request was made but no response was received
    message = "No response from server. Please check your connection";
  } else {
    // Something else happened in setting up the request
    message = error.message || message;
  }
  
  toast.error(message);
  return fallback;
}; 
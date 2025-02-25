"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { setUser, clearUser } from "@/redux/features/auth/authSlice";
import { authService } from "@/services/api";
import { toast } from "sonner";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const [isValidating, setIsValidating] = useState(true);
  
  useEffect(() => {
    // Skip validation on server
    if (typeof window === 'undefined') {
      setIsValidating(false);
      return;
    }
    
    const validateToken = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Log token for debugging
        console.log(`Token in localStorage: ${token ? 'exists' : 'missing'}`);
        
        if (token) {
          try {
            console.log('Validating token with server...');
            const user = await authService.validateToken();
            console.log('Token validation successful:', user);
            dispatch(setUser(user));
          } catch (error) {
            console.error("Token validation failed:", error);
            
            // Clear invalid token
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            dispatch(clearUser());
            
            // Don't show toast on initial load to avoid annoying users
            // Only show if they were previously logged in
            if (localStorage.getItem('wasLoggedIn') === 'true') {
              toast.error("Your session has expired. Please log in again.");
            }
            localStorage.removeItem('wasLoggedIn');
          }
        } else {
          console.log('No token found, user is not authenticated');
          dispatch(clearUser());
        }
      } catch (error) {
        console.error("Auth provider error:", error);
        dispatch(clearUser());
      } finally {
        setIsValidating(false);
      }
    };
    
    validateToken();
  }, [dispatch]);
  
  // Show a simple loading state while validating
  if (isValidating) {
    return <div className="min-h-screen"></div>;
  }
  
  // Wrap any client-side only content with ClientOnly
  return (
    <>
      {children}
    </>
  );
} 
"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getCurrentUser } from "@/redux/features/auth/authSlice";
import { usePathname, useRouter } from "next/navigation";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, loading, token } = useSelector((state: RootState) => state.auth);
  
  useEffect(() => {
    // If there's a token, try to get the current user
    if (token && !isAuthenticated && !loading) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, token, isAuthenticated, loading]);
  
  return <>{children}</>;
} 
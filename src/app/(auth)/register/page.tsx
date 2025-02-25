"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RegisterForm } from "@/app/(auth)/register/_components/register-form";
import { AuthCard } from "@/components/auth/auth-card";

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth);
  
  useEffect(() => {
    // If already authenticated, redirect to home
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);
  
  const footerContent = (
    <p className="text-sm text-muted-foreground">
      Already have an account?{" "}
      <Link href="/login" className="text-primary hover:underline">
        Sign in
      </Link>
    </p>
  );
  
  return (
    <AuthCard
      title="Create an account"
      description="Join MemeVerse to create, upload, and share memes"
      footer={footerContent}
    >
      <RegisterForm loading={loading} error={error} />
    </AuthCard>
  );
} 
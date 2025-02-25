"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/app/(auth)/login/_components/login-form";
import { AuthCard } from "@/components/auth/auth-card";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading, error } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    // If already authenticated, redirect to home
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const footerContent = (
    <p className="text-sm text-muted-foreground">
      Don&apos;t have an account?{" "}
      <Link href="/register" className="text-primary hover:underline">
        Sign up
      </Link>
    </p>
  );

  return (
    <AuthCard
      title="Welcome back!"
      description="Enter your credentials to sign in to your account"
      footer={footerContent}
    >
      <LoginForm loading={loading} error={error} />
    </AuthCard>
  );
}

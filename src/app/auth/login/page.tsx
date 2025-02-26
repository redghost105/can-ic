"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/AuthForm";
import { LoginFormValues } from "@/lib/validation";
import { login } from "@/lib/auth-actions";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const router = useRouter();

  const handleSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const result = await login(data);

      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your MechanicOnDemand account
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <div>
                <Link
                  href="/auth/register"
                  className="flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
                >
                  Create a new account
                </Link>
              </div>
              <div>
                <Link
                  href="/auth/forgot-password"
                  className="flex w-full justify-center text-sm text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
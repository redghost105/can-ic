"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/AuthForm";
import { ResetPasswordFormValues } from "@/lib/validation";
import { resetPassword } from "@/lib/auth-actions";

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    setError(undefined);
    setSuccess(false);

    try {
      const result = await resetPassword(data);

      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);

      // After a short delay, redirect to login
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Password Reset Successfully</h1>
            <p className="mt-2 text-gray-600">
              Your password has been reset. You will be redirected to the login page.
            </p>
            <div className="mt-6">
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-500"
              >
                Return to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create New Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter a new password for your account
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <ResetPasswordForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
} 
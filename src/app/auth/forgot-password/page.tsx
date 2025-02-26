"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/AuthForm";
import { ForgotPasswordFormValues } from "@/lib/validation";
import { forgotPassword } from "@/lib/auth-actions";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setError(undefined);
    setSuccess(false);

    try {
      const result = await forgotPassword(data);

      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);
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
            <h1 className="text-3xl font-bold">Check Your Email</h1>
            <p className="mt-2 text-gray-600">
              We've sent you an email with instructions to reset your password.
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
          <h1 className="text-3xl font-bold">Reset Your Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <ForgotPasswordForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
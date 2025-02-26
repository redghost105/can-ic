"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/auth/AuthForm";
import { RegisterFormValues } from "@/lib/validation";
import { register } from "@/lib/auth-actions";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(undefined);
    setSuccess(false);

    try {
      const result = await register(data);

      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);

      // We don't redirect immediately since we might need to verify email
      // depending on the Supabase configuration
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
            <h1 className="text-3xl font-bold">Registration Successful</h1>
            <p className="mt-2 text-gray-600">
              Please check your email to verify your account. Once verified, you can log in.
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
          <h1 className="text-3xl font-bold">Create an Account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Join MechanicOnDemand today
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <RegisterForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
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
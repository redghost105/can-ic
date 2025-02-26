import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import {
  LoginFormValues,
  RegisterFormValues,
  loginSchema,
  registerSchema,
  ForgotPasswordFormValues,
  forgotPasswordSchema,
  ResetPasswordFormValues,
  resetPasswordSchema,
} from "@/lib/validation";

interface LoginFormProps {
  onSubmit: (data: LoginFormValues) => void;
  isLoading: boolean;
  error?: string;
}

export function LoginForm({ onSubmit, isLoading, error }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <Input
          id="email"
          type="email"
          error={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <Input
          id="password"
          type="password"
          error={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" isLoading={isLoading} className="w-full">
        Sign In
      </Button>
    </form>
  );
}

interface RegisterFormProps {
  onSubmit: (data: RegisterFormValues) => void;
  isLoading: boolean;
  error?: string;
}

export function RegisterForm({ onSubmit, isLoading, error }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <Input
            id="firstName"
            error={!!errors.firstName}
            {...register("firstName")}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <Input
            id="lastName"
            error={!!errors.lastName}
            {...register("lastName")}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <Input
          id="email"
          type="email"
          error={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone (optional)
        </label>
        <Input
          id="phone"
          type="tel"
          error={!!errors.phone}
          {...register("phone")}
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <Input
          id="password"
          type="password"
          error={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          error={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          I am registering as a
        </label>
        <select
          id="role"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          {...register("role")}
        >
          <option value="customer">Car Owner</option>
          <option value="driver">Driver</option>
          <option value="shop">Mechanic Shop</option>
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          id="termsAccepted"
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          {...register("termsAccepted")}
        />
        <label htmlFor="termsAccepted" className="ml-2 block text-sm text-gray-700">
          I agree to the terms and conditions
        </label>
      </div>
      {errors.termsAccepted && (
        <p className="mt-1 text-sm text-red-600">{errors.termsAccepted.message}</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" isLoading={isLoading} className="w-full">
        Create Account
      </Button>
    </form>
  );
}

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordFormValues) => void;
  isLoading: boolean;
  error?: string;
}

export function ForgotPasswordForm({ onSubmit, isLoading, error }: ForgotPasswordFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <Input
          id="email"
          type="email"
          error={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" isLoading={isLoading} className="w-full">
        Reset Password
      </Button>
    </form>
  );
}

interface ResetPasswordFormProps {
  onSubmit: (data: ResetPasswordFormValues) => void;
  isLoading: boolean;
  error?: string;
}

export function ResetPasswordForm({ onSubmit, isLoading, error }: ResetPasswordFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          New Password
        </label>
        <Input
          id="password"
          type="password"
          error={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm New Password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          error={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" isLoading={isLoading} className="w-full">
        Set New Password
      </Button>
    </form>
  );
} 
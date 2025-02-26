"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { insertRecord } from "@/lib/database";
import { 
  LoginFormValues, 
  RegisterFormValues,
  ForgotPasswordFormValues, 
  ResetPasswordFormValues 
} from "@/lib/validation";
import { formatErrorMessage } from "@/lib/utils";

export async function login(formData: LoginFormValues) {
  const supabase = createServerSupabaseClient();
  
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: formatErrorMessage(error) };
  }
}

export async function register(formData: RegisterFormValues) {
  const supabase = createServerSupabaseClient();
  
  try {
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || "Failed to create account" };
    }

    // Then create the user profile
    const userData = {
      id: authData.user.id,
      email: formData.email,
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: formData.phone || null,
      role: formData.role,
    };

    const userRecord = await insertRecord('users', userData);
    
    if (!userRecord) {
      // If profile creation fails, we should ideally delete the auth user
      // but Supabase doesn't have a simple API for this from the client
      return { success: false, error: "Failed to create user profile" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: formatErrorMessage(error) };
  }
}

export async function logout() {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  cookies().delete("supabase-auth-token");
  redirect("/auth/login");
}

export async function forgotPassword(formData: ForgotPasswordFormValues) {
  const supabase = createServerSupabaseClient();
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: formatErrorMessage(error) };
  }
}

export async function resetPassword(formData: ResetPasswordFormValues) {
  const supabase = createServerSupabaseClient();
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: formData.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: formatErrorMessage(error) };
  }
} 
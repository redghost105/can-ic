import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export type Session = {
  user: {
    id: string;
    email: string;
    name?: string;
    role: 'customer' | 'driver' | 'shop' | 'admin';
  };
};

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  
  if (error || !data.session) {
    return null;
  }
  
  // Get user profile with role information
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.session.user.id)
    .single();
  
  return {
    user: {
      id: data.session.user.id,
      email: data.session.user.email!,
      name: profile?.full_name,
      role: (profile?.role as 'customer' | 'driver' | 'shop' | 'admin') || 'customer'
    }
  };
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return session;
}

export async function requireRole(role: string | string[]): Promise<Session> {
  const session = await requireAuth();
  
  const roles = Array.isArray(role) ? role : [role];
  
  if (!roles.includes(session.user.role)) {
    redirect('/dashboard');
  }
  
  return session;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
} 
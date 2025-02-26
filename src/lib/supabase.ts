import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Create a Supabase client with anonymous key for client-side operations
 */
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

/**
 * Create a Supabase client with service role key for server-side operations
 * WARNING: This should only be used in server-side contexts
 */
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient<Database>(
    supabaseUrl,
    supabaseServiceKey
  );
};

/**
 * Helper to get the current authenticated user
 */
export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return null;
  }
  
  const { data: userData, error } = await supabase
    .from('users')
    .select('*, shops(*)')
    .eq('id', session.user.id)
    .single();
    
  if (error || !userData) {
    console.error('Error fetching user data:', error);
    return null;
  }
  
  return {
    ...session.user,
    ...userData
  };
};

// Types for our database schema
export type UserRole = 'customer' | 'mechanic' | 'driver' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  created_at: string;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: string;
  created_at: string;
}

export type ServiceStatus = 
  | 'pending_approval' 
  | 'approved' 
  | 'driver_assigned_pickup' 
  | 'in_transit_to_shop' 
  | 'at_shop' 
  | 'in_progress' 
  | 'completed' 
  | 'driver_assigned_return' 
  | 'in_transit_to_owner' 
  | 'delivered' 
  | 'cancelled';

export interface ServiceRequest {
  id: string;
  customer_id: string;
  vehicle_id: string;
  shop_id: string;
  pickup_driver_id: string | null;
  return_driver_id: string | null;
  service_type: string;
  description: string;
  status: ServiceStatus;
  pickup_date: string;
  pickup_time_slot: string;
  pickup_address: string;
  estimated_cost: number | null;
  actual_cost: number | null;
  created_at: string;
  updated_at: string;
} 
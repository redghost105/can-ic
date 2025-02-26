import { createServerSupabaseClient } from './supabase';
import { Database } from '@/types/supabase';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/**
 * Fetch a single record by ID with typed result
 */
export async function fetchById<T>(
  table: keyof Database['public']['Tables'],
  id: string,
  selectQuery: string = '*'
): Promise<T | null> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from(table)
    .select(selectQuery)
    .eq('id', id)
    .single();
    
  if (error) {
    console.error(`Error fetching ${table} by ID:`, error);
    return null;
  }
  
  return data as T;
}

/**
 * Fetch multiple records with filters and pagination
 */
export async function fetchMany<T>(
  table: keyof Database['public']['Tables'],
  {
    selectQuery = '*',
    page = 1,
    pageSize = 10,
    orderBy = 'created_at',
    orderDirection = 'desc',
    filters = {},
  }: {
    selectQuery?: string;
    page?: number;
    pageSize?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    filters?: Record<string, any>;
  }
): Promise<{ data: T[]; count: number }> {
  const supabase = createServerSupabaseClient();
  
  // Start building the query
  let query = supabase
    .from(table)
    .select(selectQuery, { count: 'exact' });
  
  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (typeof value === 'object') {
        // Handle range filters or special operators
        const { operator, value: filterValue } = value;
        switch (operator) {
          case 'gt':
            query = query.gt(key, filterValue);
            break;
          case 'gte':
            query = query.gte(key, filterValue);
            break;
          case 'lt':
            query = query.lt(key, filterValue);
            break;
          case 'lte':
            query = query.lte(key, filterValue);
            break;
          case 'like':
            query = query.like(key, `%${filterValue}%`);
            break;
          case 'ilike':
            query = query.ilike(key, `%${filterValue}%`);
            break;
          default:
            query = query.eq(key, filterValue);
        }
      } else {
        query = query.eq(key, value);
      }
    }
  });
  
  // Apply pagination and ordering
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  query = query
    .order(orderBy, { ascending: orderDirection === 'asc' })
    .range(from, to);
  
  // Execute the query
  const { data, error, count } = await query;
  
  if (error) {
    console.error(`Error fetching ${table}:`, error);
    return { data: [], count: 0 };
  }
  
  return { 
    data: data as T[], 
    count: count || 0 
  };
}

/**
 * Insert a new record
 */
export async function insertRecord<T>(
  table: keyof Database['public']['Tables'],
  data: Record<string, any>
): Promise<T | null> {
  const supabase = createServerSupabaseClient();
  
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();
    
  if (error) {
    console.error(`Error inserting into ${table}:`, error);
    return null;
  }
  
  return result as T;
}

/**
 * Update an existing record
 */
export async function updateRecord<T>(
  table: keyof Database['public']['Tables'],
  id: string,
  data: Record<string, any>
): Promise<T | null> {
  const supabase = createServerSupabaseClient();
  
  const { data: result, error } = await supabase
    .from(table)
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error(`Error updating ${table}:`, error);
    return null;
  }
  
  return result as T;
}

/**
 * Delete a record
 */
export async function deleteRecord(
  table: keyof Database['public']['Tables'],
  id: string
): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error(`Error deleting from ${table}:`, error);
    return false;
  }
  
  return true;
} 
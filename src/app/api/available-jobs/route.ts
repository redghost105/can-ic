import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    // Extract the session token from the request cookies
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    
    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }
    
    // Get user info to determine role
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Only drivers can access available jobs
    if (userData.role !== 'driver') {
      return NextResponse.json(
        { error: 'Only drivers can access available jobs' },
        { status: 403 }
      );
    }
    
    // Parse query parameters for filtering
    const url = new URL(request.url);
    const shopId = url.searchParams.get('shop_id');
    const searchTerm = url.searchParams.get('search');
    
    // Start building the query for available jobs
    // An available job is one that:
    // 1. Has status 'accepted'
    // 2. Has no pickup_driver_id
    let query = supabaseAdmin
      .from('service_requests')
      .select('*, vehicles(*), shops(*)')
      .eq('status', 'accepted')
      .is('pickup_driver_id', null);
    
    // Apply additional filters
    if (shopId) {
      query = query.eq('shop_id', shopId);
    }
    
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      
      // PostgreSQL's ilike operator for case-insensitive filtering
      query = query.or(
        `service_type.ilike.%${searchTermLower}%,` +
        `description.ilike.%${searchTermLower}%,` +
        `pickup_address.ilike.%${searchTermLower}%`
      );
    }
    
    // Order by pickup date (soonest first)
    query = query.order('pickup_date', { ascending: true });
    
    // Execute the query
    const { data: availableJobs, error: jobsError } = await query;
    
    if (jobsError) {
      return NextResponse.json(
        { error: 'Failed to fetch available jobs', details: jobsError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: availableJobs },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching available jobs:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
} 
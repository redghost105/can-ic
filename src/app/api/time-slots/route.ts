import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TimeSlotRequest } from '@/types/scheduling';

// Create a Supabase client with the service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * GET /api/time-slots
 * Retrieve time slots with optional filtering
 */
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const driverId = url.searchParams.get('driver_id');
    const date = url.searchParams.get('date');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const isAvailable = url.searchParams.get('is_available');
    
    // Get authentication token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate the token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Get the user's role
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Build the query
    let query = supabaseAdmin
      .from('time_slots')
      .select('*');
    
    // Apply filters
    if (driverId) {
      query = query.eq('driver_id', driverId);
    }
    
    if (date) {
      query = query.eq('date', date);
    }
    
    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    }
    
    if (isAvailable) {
      query = query.eq('is_available', isAvailable === 'true');
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching time slots:', error);
      return NextResponse.json({ error: 'Failed to fetch time slots' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in time slots endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/time-slots
 * Create a new time slot
 */
export async function POST(req: NextRequest) {
  try {
    // Get authentication token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate the token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Get the user's role
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Parse the request body
    const body: TimeSlotRequest = await req.json();
    
    // Validate required fields
    if (!body.driver_id || !body.date || !body.start_time || !body.end_time) {
      return NextResponse.json({ 
        error: 'Missing required fields: driver_id, date, start_time, end_time' 
      }, { status: 400 });
    }
    
    // Ensure the user is either the driver creating their own time slot
    // or an admin creating a time slot for any driver
    if (userData.role !== 'admin' && user.id !== body.driver_id) {
      return NextResponse.json({ 
        error: 'You can only create time slots for yourself' 
      }, { status: 403 });
    }
    
    // Validate that the time range is valid (end_time > start_time)
    if (body.start_time >= body.end_time) {
      return NextResponse.json({ 
        error: 'End time must be after start time' 
      }, { status: 400 });
    }
    
    // Insert the time slot
    const { data, error } = await supabaseAdmin
      .from('time_slots')
      .insert({
        driver_id: body.driver_id,
        date: body.date,
        start_time: body.start_time,
        end_time: body.end_time,
        is_available: body.is_available ?? true,
        is_recurring: body.is_recurring ?? false,
        recurrence_pattern: body.recurrence_pattern
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating time slot:', error);
      return NextResponse.json({ error: 'Failed to create time slot' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in time slots endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
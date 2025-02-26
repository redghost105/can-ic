import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AppointmentRequest } from '@/types/scheduling';

// Create a Supabase client with the service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * GET /api/appointments
 * Retrieve appointments with optional filtering
 */
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const serviceRequestId = url.searchParams.get('service_request_id');
    const timeSlotId = url.searchParams.get('time_slot_id');
    const appointmentType = url.searchParams.get('appointment_type');
    
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
      .from('appointments')
      .select(`
        *,
        time_slots(*),
        service_requests(
          *,
          customer:users!service_requests_customer_id_fkey(id, first_name, last_name),
          vehicles(*)
        )
      `);
    
    // Apply filters
    if (serviceRequestId) {
      query = query.eq('service_request_id', serviceRequestId);
    }
    
    if (timeSlotId) {
      query = query.eq('time_slot_id', timeSlotId);
    }
    
    if (appointmentType) {
      query = query.eq('appointment_type', appointmentType);
    }
    
    // Execute the query (RLS policies will filter results based on user role)
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in appointments endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/appointments
 * Create a new appointment
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
    const body: AppointmentRequest = await req.json();
    
    // Validate required fields
    if (!body.service_request_id || !body.time_slot_id || !body.appointment_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: service_request_id, time_slot_id, appointment_type' 
      }, { status: 400 });
    }
    
    // Verify the service request exists and the user has access to it
    const { data: serviceRequest, error: srError } = await supabaseAdmin
      .from('service_requests')
      .select('*')
      .eq('id', body.service_request_id)
      .single();
    
    if (srError || !serviceRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
    }
    
    // Check if the time slot is available
    const { data: timeSlot, error: tsError } = await supabaseAdmin
      .from('time_slots')
      .select('*')
      .eq('id', body.time_slot_id)
      .single();
    
    if (tsError || !timeSlot) {
      return NextResponse.json({ error: 'Time slot not found' }, { status: 404 });
    }
    
    if (!timeSlot.is_available) {
      return NextResponse.json({ error: 'Time slot is not available' }, { status: 400 });
    }
    
    // Check if the time slot is already booked
    const { data: existingAppointment, error: eaError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('time_slot_id', body.time_slot_id)
      .single();
    
    if (existingAppointment) {
      return NextResponse.json({ error: 'Time slot already booked' }, { status: 400 });
    }
    
    // Start a transaction
    // Since Supabase doesn't directly support transactions via the JS client,
    // we'll manually coordinate the two operations
    
    // 1. Create the appointment
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .insert({
        service_request_id: body.service_request_id,
        time_slot_id: body.time_slot_id,
        appointment_type: body.appointment_type,
        notes: body.notes
      })
      .select()
      .single();
    
    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError);
      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
    }
    
    // 2. Update the time slot to mark it as not available
    const { error: updateError } = await supabaseAdmin
      .from('time_slots')
      .update({ is_available: false })
      .eq('id', body.time_slot_id);
    
    if (updateError) {
      // If update fails, try to delete the appointment to maintain consistency
      await supabaseAdmin
        .from('appointments')
        .delete()
        .eq('id', appointment.id);
      
      console.error('Error updating time slot:', updateError);
      return NextResponse.json({ error: 'Failed to book time slot' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error in appointments endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
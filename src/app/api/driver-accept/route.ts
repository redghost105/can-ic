import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
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
    
    // Only drivers can accept jobs
    if (userData.role !== 'driver') {
      return NextResponse.json(
        { error: 'Only drivers can accept jobs' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const requestData = await request.json();
    
    // Validate required fields
    if (!requestData.serviceRequestId) {
      return NextResponse.json(
        { error: 'Missing required field: serviceRequestId' },
        { status: 400 }
      );
    }
    
    // Get the service request
    const { data: serviceRequest, error: serviceRequestError } = await supabaseAdmin
      .from('service_requests')
      .select('*')
      .eq('id', requestData.serviceRequestId)
      .single();
      
    if (serviceRequestError || !serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }
    
    // Check if the request is in 'accepted' status and has no pickup driver assigned
    if (serviceRequest.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Service request must be in \'accepted\' status to be assigned a driver' },
        { status: 400 }
      );
    }
    
    if (serviceRequest.pickup_driver_id) {
      return NextResponse.json(
        { error: 'Service request already has a pickup driver assigned' },
        { status: 400 }
      );
    }
    
    // Update the service request
    const { data: updatedServiceRequest, error: updateError } = await supabaseAdmin
      .from('service_requests')
      .update({
        pickup_driver_id: user.id,
        status: 'driver_assigned_pickup',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestData.serviceRequestId)
      .select()
      .single();
      
    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update service request', details: updateError.message },
        { status: 500 }
      );
    }
    
    // Create a notification for the customer
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: serviceRequest.customer_id,
        type: 'driver_update',
        title: 'Driver Assigned',
        message: `A driver has been assigned to pick up your vehicle for your ${serviceRequest.service_type} service.`
      });
      
    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Continue even if notification creation fails
    }
    
    return NextResponse.json(
      { success: true, data: updatedServiceRequest },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error accepting job:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
} 
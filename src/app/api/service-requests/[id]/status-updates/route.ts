import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET handler for fetching status updates for a service request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const serviceRequestId = params.id;
    if (!serviceRequestId) {
      return NextResponse.json(
        { error: 'Service request ID is required' },
        { status: 400 }
      );
    }

    // First, get the service request to verify ownership
    const { data: serviceRequest, error: serviceRequestError } = await supabase
      .from('service_requests')
      .select('customer_id, driver_id, shop_id')
      .eq('id', serviceRequestId)
      .single();

    if (serviceRequestError) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }

    // Check if the user has access to this service request
    const userId = user.id;
    const userRole = user.role;
    
    const isAuthorized = 
      userRole === 'admin' || 
      serviceRequest.customer_id === userId || 
      serviceRequest.driver_id === userId || 
      serviceRequest.shop_id === userId;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'You do not have permission to access this service request' },
        { status: 403 }
      );
    }

    // Get the status updates
    const { data: statusUpdates, error: statusUpdatesError } = await supabase
      .from('service_request_status_updates')
      .select('*')
      .eq('service_request_id', serviceRequestId)
      .order('timestamp', { ascending: true });

    if (statusUpdatesError) {
      return NextResponse.json(
        { error: 'Failed to fetch status updates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: statusUpdates });
  } catch (error) {
    console.error('Error in GET status updates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new status update for a service request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const serviceRequestId = params.id;
    if (!serviceRequestId) {
      return NextResponse.json(
        { error: 'Service request ID is required' },
        { status: 400 }
      );
    }

    // First, get the service request to verify permissions
    const { data: serviceRequest, error: serviceRequestError } = await supabase
      .from('service_requests')
      .select('customer_id, driver_id, shop_id, status')
      .eq('id', serviceRequestId)
      .single();

    if (serviceRequestError) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }

    // Check if the user has permission to update the status
    const userId = user.id;
    const userRole = user.role;
    
    // Only drivers, shops, and admins can update status
    const canUpdateStatus = 
      userRole === 'admin' || 
      serviceRequest.driver_id === userId || 
      serviceRequest.shop_id === userId;

    if (!canUpdateStatus) {
      return NextResponse.json(
        { error: 'You do not have permission to update the status of this service request' },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate the status
    const validStatuses = [
      'pending', 
      'accepted', 
      'on_the_way', 
      'arrived', 
      'in_progress', 
      'completed', 
      'cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status provided' },
        { status: 400 }
      );
    }

    // Create the status update
    const { data: statusUpdate, error: statusUpdateError } = await supabase
      .from('service_request_status_updates')
      .insert({
        service_request_id: serviceRequestId,
        status,
        notes,
        updated_by: userId,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (statusUpdateError) {
      return NextResponse.json(
        { error: 'Failed to create status update' },
        { status: 500 }
      );
    }

    // Update the status on the service request as well
    const { error: updateError } = await supabase
      .from('service_requests')
      .update({ status, last_updated_at: new Date().toISOString() })
      .eq('id', serviceRequestId);

    if (updateError) {
      console.error('Failed to update service request status:', updateError);
      // Continue anyway, as we at least created the status update
    }

    return NextResponse.json({ 
      data: statusUpdate,
      message: 'Status update created successfully' 
    });
  } catch (error) {
    console.error('Error in POST status update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
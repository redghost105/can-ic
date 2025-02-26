import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Get service request ID from the URL
    const serviceRequestId = params.id;
    
    if (!serviceRequestId) {
      return NextResponse.json(
        { error: 'Service request ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch the service request with related data
    const { data: serviceRequest, error: serviceRequestError } = await supabaseAdmin
      .from('service_requests')
      .select('*, vehicles(*), shops(*), payments(*)')
      .eq('id', serviceRequestId)
      .single();
      
    if (serviceRequestError) {
      return NextResponse.json(
        { error: 'Failed to fetch service request', details: serviceRequestError.message },
        { status: 500 }
      );
    }
    
    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }
    
    // Check if the user has permission to view this service request
    // Customers can only view their own requests
    // Mechanics can only view requests assigned to their shop
    // Drivers can only view requests they're assigned to
    // Admins can view all requests
    let hasPermission = false;
    
    if (userData.role === 'admin') {
      hasPermission = true;
    } else if (userData.role === 'customer' && serviceRequest.customer_id === user.id) {
      hasPermission = true;
    } else if (userData.role === 'mechanic') {
      // Check if mechanic owns the shop associated with this request
      const { data: shopData } = await supabaseAdmin
        .from('shops')
        .select('*')
        .eq('id', serviceRequest.shop_id)
        .eq('owner_id', user.id)
        .single();
        
      if (shopData) {
        hasPermission = true;
      }
    } else if (userData.role === 'driver' && 
              (serviceRequest.pickup_driver_id === user.id || 
               serviceRequest.return_driver_id === user.id)) {
      hasPermission = true;
    }
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to view this service request' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: serviceRequest },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching service request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Get service request ID from the URL
    const serviceRequestId = params.id;
    
    if (!serviceRequestId) {
      return NextResponse.json(
        { error: 'Service request ID is required' },
        { status: 400 }
      );
    }
    
    // Get the current service request
    const { data: currentServiceRequest, error: serviceRequestError } = await supabaseAdmin
      .from('service_requests')
      .select('*')
      .eq('id', serviceRequestId)
      .single();
      
    if (serviceRequestError) {
      return NextResponse.json(
        { error: 'Failed to fetch service request', details: serviceRequestError.message },
        { status: 500 }
      );
    }
    
    if (!currentServiceRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }
    
    // Check if the user has permission to update this service request
    let hasPermission = false;
    let allowedFields: string[] = [];
    
    if (userData.role === 'admin') {
      // Admins can update any field
      hasPermission = true;
      allowedFields = ['status', 'shop_id', 'price', 'pickup_driver_id', 'return_driver_id', 'pickup_date', 'pickup_time_slot', 'pickup_address', 'return_date', 'return_time_slot'];
    } else if (userData.role === 'customer' && currentServiceRequest.customer_id === user.id) {
      // Customers can only update certain fields and only when in certain statuses
      hasPermission = true;
      
      if (currentServiceRequest.status === 'pending') {
        // Customers can update details if the request is still pending
        allowedFields = ['service_type', 'description', 'pickup_date', 'pickup_time_slot', 'pickup_address'];
      } else if (currentServiceRequest.status === 'pending_payment') {
        // No field updates allowed in pending_payment status for customers
        hasPermission = false;
      }
    } else if (userData.role === 'mechanic') {
      // Check if mechanic owns the shop associated with this request
      const { data: shopData } = await supabaseAdmin
        .from('shops')
        .select('*')
        .eq('id', currentServiceRequest.shop_id)
        .eq('owner_id', user.id)
        .single();
        
      if (shopData) {
        hasPermission = true;
        
        // Mechanics can update status, price, and dates
        if (['accepted', 'in_progress'].includes(currentServiceRequest.status)) {
          allowedFields = ['status', 'price', 'return_date', 'return_time_slot'];
        } else if (currentServiceRequest.status === 'completed') {
          // Can only change to pending_payment from completed
          allowedFields = ['status'];
        }
      }
    } else if (userData.role === 'driver' && 
               (currentServiceRequest.pickup_driver_id === user.id || 
                currentServiceRequest.return_driver_id === user.id)) {
      // Drivers can only update certain fields
      hasPermission = true;
      
      // Drivers can only update the status in certain conditions
      if (currentServiceRequest.pickup_driver_id === user.id && 
          currentServiceRequest.status === 'accepted') {
        allowedFields = ['status']; // Can change to 'in_progress'
      } else if (currentServiceRequest.return_driver_id === user.id && 
                currentServiceRequest.status === 'pending_payment') {
        // Can't update during pending_payment
        hasPermission = false;
      }
    }
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to update this service request' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    
    // Filter out fields that are not allowed to be updated by this user
    const allowedUpdates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        allowedUpdates[field] = body[field];
      }
    }
    
    // If there are no allowed updates, return an error
    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    // Validate status transitions
    if (allowedUpdates.status) {
      const isValidTransition = validateStatusTransition(
        currentServiceRequest.status,
        allowedUpdates.status,
        userData.role
      );
      
      if (!isValidTransition) {
        return NextResponse.json(
          { error: `Invalid status transition from ${currentServiceRequest.status} to ${allowedUpdates.status}` },
          { status: 400 }
        );
      }
    }
    
    // Update the service request
    const { data: updatedServiceRequest, error: updateError } = await supabaseAdmin
      .from('service_requests')
      .update(allowedUpdates)
      .eq('id', serviceRequestId)
      .select()
      .single();
      
    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update service request', details: updateError.message },
        { status: 500 }
      );
    }
    
    // If status was updated to 'pending_payment', create a payment record if it doesn't exist
    if (allowedUpdates.status === 'pending_payment' && 
        currentServiceRequest.status !== 'pending_payment') {
      // Check if a payment record already exists
      const { data: existingPayment } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('service_request_id', serviceRequestId)
        .single();
        
      if (!existingPayment && updatedServiceRequest.price) {
        // Create a new payment record
        await supabaseAdmin
          .from('payments')
          .insert({
            service_request_id: serviceRequestId,
            amount: updatedServiceRequest.price,
            currency: 'USD',
            payment_method: 'card',
            status: 'pending'
          });
      }
    }
    
    return NextResponse.json(
      { success: true, data: updatedServiceRequest },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating service request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to validate status transitions
function validateStatusTransition(
  currentStatus: string,
  newStatus: string,
  userRole: string
): boolean {
  // Define valid status transitions based on roles
  const validTransitions: Record<string, Record<string, string[]>> = {
    admin: {
      pending: ['accepted', 'cancelled'],
      accepted: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: ['pending_payment', 'cancelled'],
      pending_payment: ['paid', 'cancelled'],
      paid: ['cancelled'],
      cancelled: ['pending']
    },
    customer: {
      pending: ['cancelled'],
      accepted: ['cancelled'],
      // Other statuses cannot be changed by customers
    },
    mechanic: {
      accepted: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: ['pending_payment'],
    },
    driver: {
      // Drivers handle pickup and delivery logistics
      accepted: ['in_progress'], // When picking up the vehicle
      completed: ['pending_payment'], // When delivering the vehicle
    }
  };
  
  // Check if the role has any valid transitions
  if (!validTransitions[userRole]) {
    return false;
  }
  
  // Check if the current status has any valid transitions for this role
  if (!validTransitions[userRole][currentStatus]) {
    return false;
  }
  
  // Check if the new status is a valid transition from the current status for this role
  return validTransitions[userRole][currentStatus].includes(newStatus);
} 
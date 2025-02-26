import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ServiceRequest } from '@/lib/supabase';

// Define the status type for type safety
type RequestStatus = 'pending_approval' | 'approved' | 'rejected' | 'in_progress' | 
                     'completed' | 'picked_up' | 'delivered' | 'pending_payment' | 
                     'paid' | 'cancelled';

// Define the role type for users
type UserRole = 'customer' | 'mechanic' | 'driver' | 'admin';

// Types for the service request
interface ServiceRequestData {
  customer_id: string;
  vehicle_id: string;
  shop_id: string;
  service_type: string;
  description: string;
  status: RequestStatus;
  pickup_date: string;
  pickup_time_slot: string;
  pickup_address: string;
  pickup_driver_id?: string;
  return_driver_id?: string;
  price?: number;
  notes?: string;
  estimated_completion?: string;
}

// Types for the user data
interface UserData {
  id: string;
  role: UserRole;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}

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
    
    // Get user info to verify role
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (userError || !userData || userData.role !== 'customer') {
      return NextResponse.json(
        { error: 'Only customers can create service requests' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const requestData = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'vehicleMake', 
      'vehicleModel', 
      'vehicleYear', 
      'serviceType', 
      'description', 
      'selectedShopId',
      'pickupDate',
      'pickupTimeSlot',
      'pickupAddress'
    ];
    
    for (const field of requiredFields) {
      if (!requestData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Create or get vehicle record
    const { data: vehicleData, error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .insert([
        {
          owner_id: user.id,
          make: requestData.vehicleMake,
          model: requestData.vehicleModel,
          year: requestData.vehicleYear,
        }
      ])
      .select()
      .single();
      
    if (vehicleError) {
      return NextResponse.json(
        { error: 'Failed to create vehicle record', details: vehicleError.message },
        { status: 500 }
      );
    }
    
    // Create the service request
    const serviceRequestData = {
      customer_id: user.id,
      vehicle_id: vehicleData.id,
      shop_id: requestData.selectedShopId,
      service_type: requestData.serviceType,
      description: requestData.description,
      status: 'pending_approval',
      pickup_date: requestData.pickupDate,
      pickup_time_slot: requestData.pickupTimeSlot,
      pickup_address: requestData.pickupAddress,
    };
    
    const { data: serviceRequest, error: serviceRequestError } = await supabaseAdmin
      .from('service_requests')
      .insert([serviceRequestData])
      .select()
      .single();
      
    if (serviceRequestError) {
      return NextResponse.json(
        { error: 'Failed to create service request', details: serviceRequestError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: serviceRequest },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating service request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}

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
    
    let query = supabaseAdmin.from('service_requests').select('*, vehicles(*), shops(*)');
    
    // Filter requests based on user role
    if (userData.role === 'customer') {
      // Customers see only their requests
      query = query.eq('customer_id', user.id);
    } else if (userData.role === 'mechanic') {
      // Mechanics see requests for their shop
      const { data: shopData } = await supabaseAdmin
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .single();
        
      if (shopData) {
        query = query.eq('shop_id', shopData.id);
      }
    } else if (userData.role === 'driver') {
      // Drivers see requests they're assigned to
      query = query.or(`pickup_driver_id.eq.${user.id},return_driver_id.eq.${user.id}`);
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    if (status) {
      query = query.eq('status', status);
    }
    
    // Execute query
    const { data: serviceRequests, error: serviceRequestsError } = await query;
    
    if (serviceRequestsError) {
      return NextResponse.json(
        { error: 'Failed to fetch service requests', details: serviceRequestsError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: serviceRequests },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching service requests:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
} 
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
    
    // Parse query parameters for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const searchTerm = url.searchParams.get('search');
    const shopId = url.searchParams.get('shop_id');
    
    // Start building the query
    let query = supabaseAdmin.from('service_requests').select('*, vehicles(*), shops(*), payments(*)');
    
    // Apply filters based on user role
    if (userData.role === 'customer') {
      // Customers can only see their own requests
      query = query.eq('customer_id', user.id);
    } else if (userData.role === 'mechanic') {
      // Mechanics can only see requests assigned to their shop
      const { data: shopData } = await supabaseAdmin
        .from('shops')
        .select('id')
        .eq('owner_id', user.id);
        
      const shopIds = shopData?.map(shop => shop.id) || [];
      if (shopIds.length > 0) {
        query = query.in('shop_id', shopIds);
      } else {
        // If mechanic has no shops, return empty result
        return NextResponse.json(
          { success: true, data: [] },
          { status: 200 }
        );
      }
    } else if (userData.role === 'driver') {
      // Drivers can only see requests they're assigned to
      query = query.or(`pickup_driver_id.eq.${user.id},return_driver_id.eq.${user.id}`);
    }
    // Admin can see all requests, so no additional filtering needed
    
    // Apply additional filters from query parameters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (shopId) {
      query = query.eq('shop_id', shopId);
    }
    
    // Apply search term filter if provided
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      
      // PostgreSQL's ilike operator for case-insensitive filtering
      query = query.or(
        `service_type.ilike.%${searchTermLower}%,` +
        `description.ilike.%${searchTermLower}%`
      );
    }
    
    // Order by created date (most recent first) 
    query = query.order('created_at', { ascending: false });
    
    // Execute the query
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
    
    // Only customers can create service requests
    if (userData.role !== 'customer') {
      return NextResponse.json(
        { error: 'Only customers can create service requests' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['vehicle_id', 'service_type', 'description', 'pickup_date', 'pickup_time_slot', 'pickup_address'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Validate vehicle belongs to customer
    const { data: vehicle, error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('id', body.vehicle_id)
      .eq('customer_id', user.id)
      .single();
      
    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or does not belong to you' },
        { status: 404 }
      );
    }
    
    // Validate pickup time slot
    const validTimeSlots = ['8am-10am', '10am-12pm', '12pm-2pm', '2pm-4pm', '4pm-6pm'];
    if (!validTimeSlots.includes(body.pickup_time_slot)) {
      return NextResponse.json(
        { error: 'Invalid pickup time slot' },
        { status: 400 }
      );
    }
    
    // Optional: validate pickup date is in the future
    const pickupDate = new Date(body.pickup_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (pickupDate < today) {
      return NextResponse.json(
        { error: 'Pickup date must be in the future' },
        { status: 400 }
      );
    }
    
    // Prepare service request data
    const serviceRequestData = {
      customer_id: user.id,
      vehicle_id: body.vehicle_id,
      service_type: body.service_type,
      description: body.description,
      status: 'pending',
      pickup_date: body.pickup_date,
      pickup_time_slot: body.pickup_time_slot,
      pickup_address: body.pickup_address,
      // Optional fields
      shop_id: body.shop_id || null
    };
    
    // Create the service request
    const { data: serviceRequest, error: createError } = await supabaseAdmin
      .from('service_requests')
      .insert(serviceRequestData)
      .select()
      .single();
      
    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create service request', details: createError.message },
        { status: 500 }
      );
    }
    
    // If shop is provided, automatically set status to 'accepted'
    if (body.shop_id) {
      // Check if the shop exists and is active
      const { data: shop, error: shopError } = await supabaseAdmin
        .from('shops')
        .select('*')
        .eq('id', body.shop_id)
        .eq('is_active', true)
        .single();
        
      if (!shopError && shop) {
        // Update the service request status to 'accepted'
        await supabaseAdmin
          .from('service_requests')
          .update({ status: 'accepted' })
          .eq('id', serviceRequest.id);
          
        // Update the local service request data
        serviceRequest.status = 'accepted';
      }
    }
    
    // Create a notification for the customer
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'service_request_update',
        title: 'Service Request Created',
        message: `Your service request for ${serviceRequest.service_type} has been created successfully.`
      });
    
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
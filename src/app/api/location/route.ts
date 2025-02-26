import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST handler for updating driver location
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { user } = session;
    
    // Only drivers can update their location
    if (user.role !== 'driver') {
      return NextResponse.json(
        { error: 'Only drivers can update their location' },
        { status: 403 }
      );
    }
    
    const requestBody = await request.json();
    
    // Validate request body
    if (!requestBody.latitude || !requestBody.longitude) {
      return NextResponse.json(
        { error: 'Missing required fields: latitude, longitude' },
        { status: 400 }
      );
    }
    
    // Check if latitude and longitude are valid numbers
    const latitude = parseFloat(requestBody.latitude);
    const longitude = parseFloat(requestBody.longitude);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude values' },
        { status: 400 }
      );
    }
    
    // Check if latitude and longitude are in valid ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Latitude must be between -90 and 90, and longitude must be between -180 and 180' },
        { status: 400 }
      );
    }
    
    // Check if driver record exists
    const { data: existingDriver, error: driverError } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (driverError && driverError.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
      console.error('Error checking for existing driver:', driverError);
      return NextResponse.json(
        { error: 'Failed to check for existing driver' },
        { status: 500 }
      );
    }
    
    const locationData = {
      latitude,
      longitude,
      last_updated: new Date().toISOString()
    };
    
    let result;
    
    if (existingDriver) {
      // Update existing driver location
      const { data, error } = await supabase
        .from('drivers')
        .update({
          current_location: locationData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating driver location:', error);
        return NextResponse.json(
          { error: 'Failed to update driver location' },
          { status: 500 }
        );
      }
      
      result = data;
    } else {
      // Create new driver record with location
      const { data, error } = await supabase
        .from('drivers')
        .insert([{
          user_id: user.id,
          current_location: locationData,
          is_available: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating driver with location:', error);
        return NextResponse.json(
          { error: 'Failed to create driver location' },
          { status: 500 }
        );
      }
      
      result = data;
    }
    
    return NextResponse.json({ 
      success: true, 
      data: {
        ...result,
        current_location: locationData
      }
    });
  } catch (error) {
    console.error('Unexpected error updating driver location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for retrieving driver location
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driver_id');
    const serviceRequestId = searchParams.get('service_request_id');
    
    if (!driverId && !serviceRequestId) {
      return NextResponse.json(
        { error: 'Missing required parameter: driver_id or service_request_id' },
        { status: 400 }
      );
    }
    
    if (driverId) {
      // Fetch driver location by driver_id
      const { data: driver, error } = await supabase
        .from('drivers')
        .select('user_id, current_location, is_available, updated_at')
        .eq('user_id', driverId)
        .single();
      
      if (error) {
        console.error('Error fetching driver location:', error);
        return NextResponse.json(
          { error: 'Failed to fetch driver location' },
          { status: 500 }
        );
      }
      
      if (!driver || !driver.current_location) {
        return NextResponse.json(
          { error: 'Driver location not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ success: true, data: driver });
    } else {
      // Fetch driver location by service_request_id
      const { data: serviceRequest, error: serviceRequestError } = await supabase
        .from('service_requests')
        .select('driver_id, status')
        .eq('id', serviceRequestId)
        .single();
      
      if (serviceRequestError) {
        console.error('Error fetching service request:', serviceRequestError);
        return NextResponse.json(
          { error: 'Failed to fetch service request' },
          { status: 500 }
        );
      }
      
      if (!serviceRequest) {
        return NextResponse.json(
          { error: 'Service request not found' },
          { status: 404 }
        );
      }
      
      if (!serviceRequest.driver_id) {
        return NextResponse.json(
          { error: 'No driver assigned to this service request' },
          { status: 404 }
        );
      }
      
      // Check if the status is one where location tracking is relevant
      const trackableStatuses = [
        'pickup_in_progress',
        'picked_up',
        'in_transit_to_shop',
        'delivery_in_progress',
        'in_transit_to_owner'
      ];
      
      if (!trackableStatuses.includes(serviceRequest.status)) {
        return NextResponse.json(
          { error: 'Driver location tracking is not available for the current status' },
          { status: 400 }
        );
      }
      
      // Get the driver location
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('user_id, current_location, updated_at')
        .eq('user_id', serviceRequest.driver_id)
        .single();
      
      if (driverError) {
        console.error('Error fetching driver location:', driverError);
        return NextResponse.json(
          { error: 'Failed to fetch driver location' },
          { status: 500 }
        );
      }
      
      if (!driver || !driver.current_location) {
        return NextResponse.json(
          { error: 'Driver location not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ success: true, data: driver });
    }
  } catch (error) {
    console.error('Unexpected error fetching driver location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
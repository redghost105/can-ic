import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth';
import { Review } from '@/types/models';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET handler for retrieving reviews
 * Can filter by service_request_id, shop_id, driver_id, or customer_id
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
    const serviceRequestId = searchParams.get('service_request_id');
    const shopId = searchParams.get('shop_id');
    const driverId = searchParams.get('driver_id');
    const customerId = searchParams.get('customer_id');
    
    let query = supabase.from('reviews').select('*');
    
    if (serviceRequestId) {
      query = query.eq('service_request_id', serviceRequestId);
    }
    
    if (shopId) {
      query = query.eq('shop_id', shopId);
    }
    
    if (driverId) {
      query = query.eq('driver_id', driverId);
    }
    
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new review
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
    const requestBody = await request.json();
    
    // Validate request body
    if (!requestBody.service_request_id || !requestBody.rating) {
      return NextResponse.json(
        { error: 'Missing required fields: service_request_id, rating' },
        { status: 400 }
      );
    }
    
    // Ensure rating is between 1 and 5
    if (requestBody.rating < 1 || requestBody.rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if the user has already submitted a review for this service request
    const { data: existingReview, error: existingError } = await supabase
      .from('reviews')
      .select('*')
      .eq('service_request_id', requestBody.service_request_id)
      .eq('customer_id', user.id);
    
    if (existingError) {
      console.error('Error checking for existing review:', existingError);
      return NextResponse.json(
        { error: 'Failed to check for existing review' },
        { status: 500 }
      );
    }
    
    if (existingReview && existingReview.length > 0) {
      return NextResponse.json(
        { error: 'You have already submitted a review for this service request' },
        { status: 400 }
      );
    }
    
    // Verify that the service request exists and is completed
    const { data: serviceRequest, error: serviceRequestError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', requestBody.service_request_id)
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
    
    // Only allow reviews for completed service requests
    if (serviceRequest.status !== 'completed' && serviceRequest.status !== 'delivered' && serviceRequest.status !== 'paid') {
      return NextResponse.json(
        { error: 'Service request must be completed before submitting a review' },
        { status: 400 }
      );
    }
    
    // Verify that the user is the customer who created the service request
    if (serviceRequest.customer_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only review your own service requests' },
        { status: 403 }
      );
    }
    
    // Create the review
    const reviewData: Omit<Review, 'id' | 'created_at' | 'updated_at'> = {
      service_request_id: requestBody.service_request_id,
      customer_id: user.id,
      rating: requestBody.rating,
      comment: requestBody.comment || '',
      shop_id: serviceRequest.shop_id,
      driver_id: serviceRequest.driver_id
    };
    
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating review:', error);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }
    
    // Create notification for the shop about the new review
    if (serviceRequest.shop_id) {
      await supabase.from('notifications').insert([{
        user_id: serviceRequest.shop_id,
        type: 'review_request',
        title: 'New Review Received',
        message: `A customer has left a ${requestBody.rating}-star review for your services.`,
        related_id: data.id,
        is_read: false,
        channel: 'in_app'
      }]);
    }
    
    // Create notification for the driver about the new review (if applicable)
    if (serviceRequest.driver_id) {
      await supabase.from('notifications').insert([{
        user_id: serviceRequest.driver_id,
        type: 'review_request',
        title: 'New Review Received',
        message: `A customer has left a ${requestBody.rating}-star review for your services.`,
        related_id: data.id,
        is_read: false,
        channel: 'in_app'
      }]);
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error creating review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
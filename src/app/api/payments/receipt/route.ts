import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth';

// Initialize Supabase client with service role for admin-level operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// Define interface for service request data
interface ServiceRequestData {
  id: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  service_type: string;
  price: number;
  tax: number | null;
  parts_cost: number | null;
  labor_cost: number | null;
  status: string;
  customer_id: string;
  shop_id: string;
  driver_id: string | null;
  vehicle: any; // Using any for simplicity
  shop: any; // Using any for simplicity
}

// Type for receipt
interface Receipt {
  id: string;
  created_at: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  last4: string;
  service_request_id: string;
  customer_id: string;
  status: string;
  service_requests: ServiceRequestData;
}

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the search parameters
    const searchParams = request.nextUrl.searchParams;
    const paymentIntentId = searchParams.get('paymentIntentId');
    const serviceRequestId = searchParams.get('serviceRequestId');
    
    // Check if at least one parameter is provided
    if (!paymentIntentId && !serviceRequestId) {
      return NextResponse.json(
        { error: 'Either paymentIntentId or serviceRequestId must be provided' },
        { status: 400 }
      );
    }
    
    // Fetch the receipt
    let query = supabase
      .from('receipts')
      .select(`
        id,
        created_at,
        payment_intent_id,
        amount,
        currency,
        payment_method,
        last4,
        service_request_id,
        customer_id,
        status,
        service_request:service_request_id(
          id,
          created_at,
          updated_at,
          completed_at,
          service_type,
          price,
          tax,
          parts_cost,
          labor_cost,
          status,
          customer_id,
          shop_id,
          driver_id,
          vehicle:vehicle_id(
            id,
            make,
            model,
            year,
            license_plate
          ),
          shop:shop_id(
            id,
            name,
            address,
            city,
            state,
            zip,
            phone
          )
        )
      `);
    
    if (paymentIntentId) {
      query = query.eq('payment_intent_id', paymentIntentId);
    } else if (serviceRequestId) {
      query = query.eq('service_request_id', serviceRequestId);
    }
    
    const { data: receipt, error } = await query.single();
    
    if (error) {
      console.error('Error fetching receipt:', error);
      return NextResponse.json(
        { error: 'Failed to fetch receipt data' },
        { status: 500 }
      );
    }
    
    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }
    
    // Additional authorization check - users should only be able to access their own receipts
    // Unless they are admin, shop, or driver associated with the service request
    const userId = session.user.id;
    const receiptOwnerId = receipt.customer_id;
    
    // Check for authorization - use optional chaining and type assertions to avoid type errors
    let isAuthorized = userId === receiptOwnerId; // Customer accessing their receipt
    
    // If user is not the receipt owner, check if they're associated with the service
    if (!isAuthorized && receipt.service_request) {
      const sr = receipt.service_request;
      isAuthorized = 
        (sr.shop_id && userId === sr.shop_id) || // Shop that provided the service
        (sr.driver_id && userId === sr.driver_id); // Driver who handled the service request
    }
    
    // For admin access, we would check roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    const isAdmin = userRoles?.some(userRole => userRole.role === 'admin');
    
    if (!isAuthorized && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to access this receipt' },
        { status: 403 }
      );
    }
    
    // Return the receipt data
    return NextResponse.json({ receipt });
    
  } catch (error) {
    console.error('Unexpected error fetching receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
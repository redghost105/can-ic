import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from 'stripe';

// Initialize Stripe without explicitly specifying an API version
// This will use the latest version supported by the library
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Get and verify authentication token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { serviceRequestId, amount } = body;
    
    if (!serviceRequestId || !amount) {
      return NextResponse.json({ 
        success: false,
        error: 'Required fields missing', 
        details: 'serviceRequestId and amount are required' 
      }, { status: 400 });
    }
    
    // Fetch the service request to verify ownership and status
    const { data: serviceRequest, error: serviceRequestError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', serviceRequestId)
      .single();
    
    if (serviceRequestError || !serviceRequest) {
      return NextResponse.json({ 
        success: false,
        error: 'Service request not found', 
      }, { status: 404 });
    }
    
    // Verify that the user is the owner of the service request or an admin
    if (serviceRequest.customer_id !== user.id && user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized', 
        details: 'You do not have permission to create a payment for this service request' 
      }, { status: 403 });
    }
    
    // Verify the status is either 'completed' or 'pending_payment'
    if (serviceRequest.status !== 'completed' && serviceRequest.status !== 'pending_payment') {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid service request status', 
        details: 'Payment can only be made for completed or payment pending service requests' 
      }, { status: 400 });
    }
    
    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        serviceRequestId,
        userId: user.id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    // Log the payment intent in the database
    await supabase.from('payment_intents').insert({
      payment_intent_id: paymentIntent.id,
      service_request_id: serviceRequestId,
      customer_id: user.id,
      amount: amount,
      status: paymentIntent.status,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
      },
    });
    
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 
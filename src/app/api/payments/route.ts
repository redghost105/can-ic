import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Create a Supabase client with the service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16', // Use the latest API version
});

// GET - Get payment intent details
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
    
    // Get query parameters
    const url = new URL(request.url);
    const paymentIntentId = url.searchParams.get('paymentIntentId');
    
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400 }
      );
    }
    
    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    return NextResponse.json(
      { success: true, data: paymentIntent },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error retrieving payment intent:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a payment intent for a service request
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
        { error: 'Only customers can make payments' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const requestData = await request.json();
    
    // Validate required fields
    if (!requestData.serviceRequestId) {
      return NextResponse.json(
        { error: 'Service Request ID is required' },
        { status: 400 }
      );
    }
    
    // Get the service request details
    const { data: serviceRequest, error: serviceRequestError } = await supabaseAdmin
      .from('service_requests')
      .select('*, shops(*)')
      .eq('id', requestData.serviceRequestId)
      .eq('customer_id', user.id)
      .single();
      
    if (serviceRequestError || !serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found or you do not have permission to access it', details: serviceRequestError?.message },
        { status: 404 }
      );
    }
    
    // Verify the service request is in pending_payment status
    if (serviceRequest.status !== 'pending_payment') {
      return NextResponse.json(
        { error: 'This service request is not ready for payment' },
        { status: 400 }
      );
    }
    
    // Verify the price is available
    if (!serviceRequest.price) {
      return NextResponse.json(
        { error: 'Service price is not yet set' },
        { status: 400 }
      );
    }
    
    // Convert price to cents for Stripe (Stripe expects amounts in the smallest currency unit)
    const amount = Math.round(serviceRequest.price * 100);
    
    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      description: `Payment for service request #${serviceRequest.id}`,
      metadata: {
        serviceRequestId: serviceRequest.id,
        customerId: user.id,
        shopId: serviceRequest.shop_id
      },
      // Optional: Set up automatic payment methods
      automatic_payment_methods: {
        enabled: true,
      }
    });
    
    // Store the payment intent in the database
    const { data: paymentRecord, error: paymentRecordError } = await supabaseAdmin
      .from('payments')
      .insert([
        {
          service_request_id: serviceRequest.id,
          customer_id: user.id,
          shop_id: serviceRequest.shop_id,
          amount: serviceRequest.price,
          payment_intent_id: paymentIntent.id,
          status: 'created',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();
      
    if (paymentRecordError) {
      // If there's an error storing the payment record, cancel the payment intent
      await stripe.paymentIntents.cancel(paymentIntent.id);
      
      return NextResponse.json(
        { error: 'Failed to store payment record', details: paymentRecordError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: true, 
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: serviceRequest.price,
          paymentRecord
        } 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
} 
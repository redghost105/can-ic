import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth';
import Stripe from 'stripe';

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const { serviceRequestId } = await request.json();
    
    if (!serviceRequestId) {
      return NextResponse.json(
        { error: 'Service request ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch the service request
    const { data: serviceRequest, error: fetchError } = await supabase
      .from('service_requests')
      .select('*, shops:shop_id(id, name, stripe_account_id)')
      .eq('id', serviceRequestId)
      .single();
      
    if (fetchError || !serviceRequest) {
      console.error('Error fetching service request:', fetchError);
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }
    
    // Check if user is authorized to pay for this service request
    if (serviceRequest.customer_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to pay for this service request' },
        { status: 403 }
      );
    }
    
    // Check if service request is in the correct status
    if (serviceRequest.status !== 'pending_payment') {
      return NextResponse.json(
        { error: 'This service request is not ready for payment' },
        { status: 400 }
      );
    }
    
    // Get the amount to charge (in cents)
    const amount = serviceRequest.final_price || serviceRequest.estimated_price;
    if (!amount) {
      return NextResponse.json(
        { error: 'No price set for this service request' },
        { status: 400 }
      );
    }
    
    const amountInCents = Math.round(amount * 100);
    
    // Create payment intent with Stripe
    let paymentIntent;
    
    // Check if shop has a Stripe account connected
    const stripeAccountId = serviceRequest.shops?.stripe_account_id;
    
    if (stripeAccountId) {
      // Create payment intent with connected account
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        application_fee_amount: Math.round(amountInCents * 0.1), // 10% platform fee
        transfer_data: {
          destination: stripeAccountId,
        },
        metadata: {
          serviceRequestId,
          customerId: user.id,
          shopId: serviceRequest.shop_id,
        },
      });
    } else {
      // Create regular payment intent (platform collects payment)
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: {
          serviceRequestId,
          customerId: user.id,
          shopId: serviceRequest.shop_id,
        },
      });
    }
    
    // Save payment intent to database
    const { error: insertError } = await supabase
      .from('payments')
      .insert({
        service_request_id: serviceRequestId,
        payment_intent_id: paymentIntent.id,
        payment_intent_client_secret: paymentIntent.client_secret,
        amount: amount,
        status: 'pending',
        customer_id: user.id,
        shop_id: serviceRequest.shop_id,
      });
      
    if (insertError) {
      console.error('Error saving payment intent:', insertError);
      return NextResponse.json(
        { error: 'Failed to create payment' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: amount,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as any, // Cast to any to bypass strict type checking
});

// Initialize Supabase client with service role for admin-level operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;
  
  let event: Stripe.Event;
  
  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }
  
  try {
    // Handle the event based on its type
    if (event.type === 'payment_intent.succeeded') {
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
    } else if (event.type === 'payment_intent.payment_failed') {
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
    }
    
    // Return a 200 response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent;
  
  if (!metadata || !metadata.serviceRequestId) {
    console.error('Payment intent succeeded but no serviceRequestId in metadata');
    return;
  }
  
  const serviceRequestId = metadata.serviceRequestId;
  
  try {
    // First, get the service request to ensure it exists and to get customer info
    const { data: serviceRequest, error: srError } = await supabase
      .from('service_requests')
      .select('*, customers(*)')
      .eq('id', serviceRequestId)
      .single();
    
    if (srError || !serviceRequest) {
      console.error('Service request not found:', srError);
      return;
    }
    
    // Update the service request status to paid
    const { error: updateError } = await supabase
      .from('service_requests')
      .update({ status: 'paid' })
      .eq('id', serviceRequestId);
    
    if (updateError) {
      console.error('Failed to update service request status:', updateError);
      return;
    }
    
    // Record the status change in the status history
    await supabase
      .from('status_history')
      .insert({
        service_request_id: serviceRequestId,
        previous_status: serviceRequest.status,
        new_status: 'paid',
        updated_by: serviceRequest.customer_id,
        notes: 'Payment processed successfully'
      });
    
    // Create a receipt
    const paymentMethod = paymentIntent.payment_method;
    let last4 = '';
    let cardBrand = '';
    
    if (paymentMethod) {
      try {
        const pmDetails = await stripe.paymentMethods.retrieve(paymentMethod as string);
        if (pmDetails.card) {
          last4 = pmDetails.card.last4;
          cardBrand = pmDetails.card.brand;
        }
      } catch (error) {
        console.error('Error fetching payment method details:', error);
      }
    }
    
    const { error: receiptError } = await supabase
      .from('receipts')
      .insert({
        payment_intent_id: paymentIntent.id,
        service_request_id: serviceRequestId,
        customer_id: serviceRequest.customer_id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_method: cardBrand,
        last4,
        status: 'successful'
      });
    
    if (receiptError) {
      console.error('Failed to create receipt:', receiptError);
    }
    
    // Create in-app notification for the customer
    await supabase
      .from('notifications')
      .insert({
        user_id: serviceRequest.customer_id,
        title: 'Payment Successful',
        message: `Your payment of ${formatAmount(paymentIntent.amount, paymentIntent.currency)} for service request #${serviceRequestId} has been processed successfully.`,
        type: 'payment',
        data: {
          serviceRequestId,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        }
      });
    
    // Create notification for the shop
    await supabase
      .from('notifications')
      .insert({
        user_id: serviceRequest.shop_id,
        title: 'Payment Received',
        message: `Payment of ${formatAmount(paymentIntent.amount, paymentIntent.currency)} for service request #${serviceRequestId} has been received.`,
        type: 'payment',
        data: {
          serviceRequestId,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        }
      });
    
    // Send email notification (assuming there's an email service function)
    try {
      // This would be replaced with an actual email sending implementation
      console.log('Sending payment success email notification to:', serviceRequest.customers.email);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }
    
  } catch (error) {
    console.error('Error processing successful payment webhook:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent;
  
  if (!metadata || !metadata.serviceRequestId) {
    console.error('Payment intent failed but no serviceRequestId in metadata');
    return;
  }
  
  const serviceRequestId = metadata.serviceRequestId;
  
  try {
    // Get the service request
    const { data: serviceRequest, error: srError } = await supabase
      .from('service_requests')
      .select('*, customers(*)')
      .eq('id', serviceRequestId)
      .single();
    
    if (srError || !serviceRequest) {
      console.error('Service request not found:', srError);
      return;
    }
    
    // Create a failed receipt record
    const { error: receiptError } = await supabase
      .from('receipts')
      .insert({
        payment_intent_id: paymentIntent.id,
        service_request_id: serviceRequestId,
        customer_id: serviceRequest.customer_id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'failed',
        error_message: paymentIntent.last_payment_error?.message || 'Payment failed'
      });
    
    if (receiptError) {
      console.error('Failed to create failed receipt record:', receiptError);
    }
    
    // Create in-app notification for the customer
    await supabase
      .from('notifications')
      .insert({
        user_id: serviceRequest.customer_id,
        title: 'Payment Failed',
        message: `Your payment of ${formatAmount(paymentIntent.amount, paymentIntent.currency)} for service request #${serviceRequestId} failed. ${paymentIntent.last_payment_error?.message || 'Please try again.'}`,
        type: 'payment',
        data: {
          serviceRequestId,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          error: paymentIntent.last_payment_error?.message
        }
      });
    
    // Send email notification
    try {
      // This would be replaced with an actual email sending implementation
      console.log('Sending payment failure email notification to:', serviceRequest.customers.email);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }
    
  } catch (error) {
    console.error('Error processing failed payment webhook:', error);
  }
}

/**
 * Format currency amount
 */
function formatAmount(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2
  });
  
  // Stripe amounts are in cents
  return formatter.format(amount / 100);
} 
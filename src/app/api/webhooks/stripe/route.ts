import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import emailService from '@/lib/email-service';

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Verify the event with Stripe
    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: 'Invalid Stripe signature' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
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
  try {
    const { serviceRequestId, customerId, shopId } = paymentIntent.metadata;
    
    if (!serviceRequestId) {
      console.error('Missing serviceRequestId in payment intent metadata');
      return;
    }

    // Update payment record in database
    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', paymentIntent.id);

    if (updatePaymentError) {
      console.error('Error updating payment record:', updatePaymentError);
    }

    // Update service request status to 'paid'
    const { data: serviceRequest, error: updateServiceError } = await supabase
      .from('service_requests')
      .update({
        status: 'paid',
        payment_status: 'paid',
        payment_date: new Date().toISOString(),
      })
      .eq('id', serviceRequestId)
      .select('*, customer:customer_id(id, email, full_name), shops:shop_id(id, email, name)')
      .single();

    if (updateServiceError) {
      console.error('Error updating service request status:', updateServiceError);
      return;
    }

    // Create receipt record
    const { error: receiptError } = await supabase
      .from('receipts')
      .insert({
        service_request_id: serviceRequestId,
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        customer_id: customerId,
        shop_id: shopId,
        receipt_url: paymentIntent.charges.data[0]?.receipt_url || null,
        created_at: new Date().toISOString(),
      });

    if (receiptError) {
      console.error('Error creating receipt record:', receiptError);
    }

    // Create notifications for both customer and shop
    await createPaymentNotifications(serviceRequest, paymentIntent.amount / 100);

    // Send email confirmation to customer
    if (serviceRequest.customer?.email) {
      await emailService.sendPaymentReceivedEmail(
        serviceRequest.customer.email,
        serviceRequest,
        paymentIntent.amount / 100
      );
    }

    console.log(`Payment for service request ${serviceRequestId} succeeded`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { serviceRequestId } = paymentIntent.metadata;
    
    if (!serviceRequestId) {
      console.error('Missing serviceRequestId in payment intent metadata');
      return;
    }

    // Update payment record in database
    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', paymentIntent.id);

    if (updatePaymentError) {
      console.error('Error updating payment record:', updatePaymentError);
    }

    // Get service request details for notifications
    const { data: serviceRequest, error: fetchError } = await supabase
      .from('service_requests')
      .select('*, customer:customer_id(id, email, full_name)')
      .eq('id', serviceRequestId)
      .single();

    if (fetchError) {
      console.error('Error fetching service request:', fetchError);
      return;
    }

    // Create notification for customer about failed payment
    if (serviceRequest.customer_id) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: serviceRequest.customer_id,
          title: 'Payment Failed',
          message: `Your payment for service request #${serviceRequestId} has failed. Please update your payment method and try again.`,
          type: 'error',
          link: `/dashboard/service-requests/${serviceRequestId}/payment`,
          is_read: false,
          created_at: new Date().toISOString(),
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
    }

    // Send email about failed payment
    if (serviceRequest.customer?.email) {
      const emailBody = `
        <div>
          <h1>Payment Failed</h1>
          <p>We were unable to process your payment for service request #${serviceRequestId}.</p>
          <p>Please check your payment method and try again.</p>
          <p>If you continue to have issues, please contact our support team.</p>
        </div>
      `;

      await emailService.sendEmail({
        to: serviceRequest.customer.email,
        subject: 'Payment Failed - Action Required',
        html: emailBody,
      });
    }

    console.log(`Payment for service request ${serviceRequestId} failed`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

/**
 * Create notifications for successful payment
 */
async function createPaymentNotifications(serviceRequest: any, amount: number) {
  try {
    // Create notification for customer
    if (serviceRequest.customer_id) {
      const { error: customerNotificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: serviceRequest.customer_id,
          title: 'Payment Successful',
          message: `Your payment of $${amount.toFixed(2)} for service request #${serviceRequest.id} has been processed. Thank you!`,
          type: 'success',
          link: `/dashboard/service-requests/${serviceRequest.id}`,
          is_read: false,
          created_at: new Date().toISOString(),
        });

      if (customerNotificationError) {
        console.error('Error creating customer notification:', customerNotificationError);
      }
    }

    // Create notification for shop
    if (serviceRequest.shop_id) {
      const { error: shopNotificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: serviceRequest.shop_id,
          title: 'Payment Received',
          message: `Payment of $${amount.toFixed(2)} for service request #${serviceRequest.id} has been received.`,
          type: 'info',
          link: `/dashboard/service-requests/${serviceRequest.id}`,
          is_read: false,
          created_at: new Date().toISOString(),
        });

      if (shopNotificationError) {
        console.error('Error creating shop notification:', shopNotificationError);
      }
    }
  } catch (error) {
    console.error('Error creating payment notifications:', error);
  }
} 
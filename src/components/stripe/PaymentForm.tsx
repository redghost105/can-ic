"use client";

import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement, AddressElement } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  serviceRequestId: string;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
}

export default function PaymentForm({ 
  clientSecret,
  amount,
  serviceRequestId,
  onPaymentSuccess,
  onPaymentError
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [paymentStatus, setPaymentStatus] = useState<'initial' | 'processing' | 'succeeded' | 'failed'>('initial');

  // Reset form if clientSecret changes
  useEffect(() => {
    if (clientSecret) {
      setPaymentStatus('initial');
      setErrorMessage(undefined);
    }
  }, [clientSecret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    setIsLoading(true);
    setPaymentStatus('processing');

    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/service-requests/confirmation?payment_intent=${clientSecret}`,
        },
        redirect: 'if_required'
      });

      if (error) {
        // Show error to customer
        setErrorMessage(error.message);
        setPaymentStatus('failed');
        if (onPaymentError) {
          onPaymentError(error.message || 'An unknown error occurred');
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        setPaymentStatus('succeeded');
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      } else {
        // Payment requires additional action or is processing
        // Usually, confirmPayment should handle redirects, but we have an explicit check here too
        if (paymentIntent && paymentIntent.status === 'requires_action') {
          // For requires_action status, we need to let stripe handle the next steps
          // This is handled automatically by the redirect in the first confirmPayment call
          console.log('Payment requires additional action');
        }
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'An unexpected error occurred');
      setPaymentStatus('failed');
      if (onPaymentError) {
        onPaymentError(e.message || 'An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Complete Your Payment</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Amount to pay: <span className="font-bold">${amount.toFixed(2)}</span>
        </p>
      </div>

      {/* Payment Element for card details */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
        <PaymentElement />
      </div>

      {/* Billing Address */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium mb-3">Billing Address</h4>
        <AddressElement options={{ mode: 'billing' }} />
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-md text-red-600 dark:text-red-400 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Success message */}
      {paymentStatus === 'succeeded' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-md text-green-600 dark:text-green-400 text-sm">
          Payment successful! Your service request has been updated.
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !elements || isLoading || paymentStatus === 'succeeded'}
        className="w-full"
      >
        {isLoading ? 'Processing...' : paymentStatus === 'succeeded' ? 'Paid' : `Pay $${amount.toFixed(2)}`}
      </Button>
    </form>
  );
} 
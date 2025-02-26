"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notification-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { get, post } from '@/utils/api';
import { ServiceRequest } from '@/types/models';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CheckCircle, CreditCard, AlertCircle, ChevronLeft, Loader2Icon, CheckCircle2Icon, DollarSignIcon, ArrowLeftIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { NotificationType } from '@/contexts/notification-context';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Mock payment form component - in a real app, this would use Stripe Elements
function PaymentForm({ onSubmit, amount }: { onSubmit: () => void; amount: number }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="card-number">
          Card Number
        </label>
        <input
          id="card-number"
          type="text"
          placeholder="4242 4242 4242 4242"
          className="w-full px-3 py-2 border rounded-md"
          defaultValue="4242 4242 4242 4242" // For demo only
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="expiry">
            Expiry Date
          </label>
          <input
            id="expiry"
            type="text"
            placeholder="MM/YY"
            className="w-full px-3 py-2 border rounded-md"
            defaultValue="12/25" // For demo only
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="cvc">
            CVC
          </label>
          <input
            id="cvc"
            type="text"
            placeholder="123"
            className="w-full px-3 py-2 border rounded-md"
            defaultValue="123" // For demo only
          />
        </div>
      </div>
      
      <Button 
        onClick={onSubmit} 
        className="w-full"
      >
        Pay ${amount.toFixed(2)}
      </Button>
      
      <p className="text-xs text-gray-500 text-center mt-2">
        This is a demo payment form. No real payments are processed.
      </p>
    </div>
  );
}

// Payment form component
const PaymentFormStripe = ({ 
  serviceRequestId,
  amount,
  onSuccess,
  onError 
}: { 
  serviceRequestId: string,
  amount: number,
  onSuccess: (paymentIntentId: string) => void,
  onError: (error: string) => void 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const { user } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setProcessing(true);
    setCardError(null);
    
    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          serviceRequestId,
          customerId: user?.id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }
      
      const { clientSecret } = data;
      
      // Confirm the payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user?.name || 'Customer',
            email: user?.email || undefined,
          },
        },
      });
      
      if (error) {
        throw new Error(error.message || 'Payment failed');
      }
      
      if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      } else {
        onError(`Payment status: ${paymentIntent.status}`);
      }
    } catch (error: any) {
      setCardError(error.message || 'An error occurred during payment');
      onError(error.message || 'An error occurred during payment');
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Card Details</label>
        <div className="p-3 border rounded-md">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
        {cardError && (
          <p className="mt-2 text-sm text-red-600">{cardError}</p>
        )}
      </div>
      
      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || processing}
        size="lg"
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay {formatCurrency(amount)}
          </>
        )}
      </Button>
    </form>
  );
};

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const serviceRequestId = params.id as string;
  
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { toast } = useToast();
  
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchServiceRequest = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch service request details
        const response = await get<ServiceRequest>(`/service-request/${serviceRequestId}`);
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch service request details');
        }
        
        setServiceRequest(response.data || null);
        
        // Create payment intent
        if (response.data && response.data.price) {
          const paymentResponse = await post('/api/create-payment-intent', {
            serviceRequestId,
            amount: response.data.price
          });
          
          if (!paymentResponse.success) {
            throw new Error(paymentResponse.error || 'Failed to create payment intent');
          }
          
          setClientSecret(paymentResponse.data.clientSecret);
        } else {
          throw new Error('No price available for this service request');
        }
      } catch (err: any) {
        console.error('Error setting up payment:', err);
        setError(err.message || 'Failed to set up payment');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (serviceRequestId) {
      fetchServiceRequest();
    }
  }, [serviceRequestId]);
  
  const handlePayment = async () => {
    setProcessing(true);
    
    try {
      // In a real app, create a payment intent and process with Stripe
      // For demo, we'll simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update service request status
      // In a real app, this would be an API call
      console.log('Payment processed successfully for service request:', serviceRequestId);
      
      // Show success message
      setPaymentSuccess(true);
      
      // Add notification
      addNotification({
        title: 'Payment Successful',
        message: `Your payment of $${serviceRequest?.price?.toFixed(2)} has been processed successfully.`,
        type: 'success',
        link: `/dashboard/service-requests/${serviceRequestId}`
      });
      
      // Show toast
      toast({
        title: 'Payment Successful',
        description: 'Your service request payment has been processed.',
      });
      
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: 'Payment Failed',
        description: 'There was an error processing your payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };
  
  const handleGoBack = () => {
    router.back();
  };
  
  const handleViewServiceRequest = () => {
    router.push(`/dashboard/service-requests/${serviceRequestId}`);
  };
  
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Update service request status
      const response = await fetch(`/api/service-requests/${serviceRequestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'paid',
          paymentIntentId,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update service request status');
      }
      
      setPaymentSuccess(true);
      setPaymentIntentId(paymentIntentId);
      
      // Add notification
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Payment Successful',
        message: `Your payment for service request #${serviceRequestId} has been processed successfully.`,
        link: `/dashboard/service-requests/${serviceRequestId}`,
      });
      
      toast({
        title: 'Payment Successful',
        description: 'Your payment has been processed successfully.',
      });
      
      // Redirect after a delay
      setTimeout(() => {
        router.push(`/dashboard/service-requests/${serviceRequestId}`);
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to update service request status');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update service request status',
      });
    }
  };
  
  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    toast({
      variant: 'destructive',
      title: 'Payment Failed',
      description: errorMessage,
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!serviceRequest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Service Request Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">The service request you're looking for does not exist or has been removed.</p>
        <Button className="mt-6" onClick={handleGoBack}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }
  
  if (error && !paymentSuccess) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-red-600">Payment Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <p className="text-lg mb-4">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (paymentSuccess) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-green-600">Payment Successful</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <p className="text-lg mb-2">Your payment has been processed successfully.</p>
          <p className="text-sm text-muted-foreground mb-4">
            Payment ID: {paymentIntentId}
          </p>
          <Button onClick={() => router.push(`/dashboard/service-requests/${serviceRequestId}`)} className="mt-4">
            View Service Request
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={handleGoBack}
        className="mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSignIcon className="h-6 w-6 mr-2 text-primary" />
            Payment for Service Request
          </CardTitle>
          <CardDescription>
            Complete payment for your service request with {serviceRequest.shop.name}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Service Summary</h3>
            <div className="bg-muted/50 p-4 rounded-md">
              <div className="flex justify-between mb-2">
                <span>Service Type:</span>
                <span className="font-medium">{serviceRequest.service_type}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Status:</span>
                <Badge variant={serviceRequest.status === 'completed' ? 'success' : 'default'}>
                  {serviceRequest.status === 'completed' ? 'Completed' : 'Pending Payment'}
                </Badge>
              </div>
              <div className="flex justify-between mb-2">
                <span>Vehicle:</span>
                <span className="font-medium">
                  {serviceRequest.vehicles?.make} {serviceRequest.vehicles?.model} ({serviceRequest.vehicles?.year})
                </span>
              </div>
              {serviceRequest.shop && (
                <div className="flex justify-between">
                  <span>Shop:</span>
                  <span className="font-medium">{serviceRequest.shop.name}</span>
                </div>
              )}
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Payment Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Service Fee:</span>
                <span>{formatCurrency(serviceRequest.service_fee || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Parts:</span>
                <span>{formatCurrency(serviceRequest.parts_cost || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Labor:</span>
                <span>{formatCurrency(serviceRequest.labor_cost || 0)}</span>
              </div>
              {serviceRequest.additional_fees > 0 && (
                <div className="flex justify-between">
                  <span>Additional Fees:</span>
                  <span>{formatCurrency(serviceRequest.additional_fees || 0)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>{formatCurrency(serviceRequest.total_cost || 0)}</span>
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <Elements stripe={stripePromise}>
            <PaymentFormStripe 
              serviceRequestId={serviceRequestId}
              amount={serviceRequest.total_cost || 0}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </Elements>
        </CardContent>
        
        <CardFooter>
          <Button onClick={handleViewServiceRequest} className="w-full">
            View Service Request
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
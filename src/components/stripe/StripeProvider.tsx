"use client";

import { ReactNode, useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Define Stripe Promise outside component to avoid recreating it on each render
let stripePromise: Promise<any> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
  }
  return stripePromise;
};

interface StripeProviderProps {
  children: ReactNode;
}

export default function StripeProvider({ children }: StripeProviderProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // This is a placeholder implementation
  // In a real app, you would set up this provider to handle multiple payment intents
  // and likely manage them in a context

  return (
    <Elements stripe={getStripe()} options={clientSecret ? { clientSecret } : undefined}>
      {children}
    </Elements>
  );
} 
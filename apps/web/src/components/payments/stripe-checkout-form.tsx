'use client';

// TODO: @stripe/react-stripe-js and @stripe/stripe-js are not installed yet.
// Once API keys and PSP APIs are available, install those dependencies and 
// implement the Elements and PaymentElement integration here.
//
// The component should accept `clientSecret: string` and an `onSuccess` callback.
// The form should call `/api/payments/checkout` first to get the clientSecret,
// then render the Elements form.
//
// Hide this component behind process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true'

import React from 'react';

interface StripeCheckoutFormProps {
  clientSecret?: string;
  onSuccess?: () => void;
}

export function StripeCheckoutForm({ clientSecret, onSuccess }: StripeCheckoutFormProps) {
  if (process.env.NEXT_PUBLIC_PAYMENTS_ENABLED !== 'true') {
    return null;
  }

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
      <p className="text-sm text-slate-400 text-center">
        Stripe Checkout Form Placeholder
      </p>
    </div>
  );
}

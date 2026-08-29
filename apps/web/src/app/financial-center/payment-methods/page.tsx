import React from 'react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import PaymentMethodsList from '../../../components/financial-center/payment-methods-list';

export const dynamic = 'force-dynamic';

export default async function PaymentMethodsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: methods } = await supabase
    .from('payment_methods')
    .select('id, provider, method_kind, brand, last4, expiry_month, expiry_year, is_default')
    .eq('owner_id', user.id)
    .order('is_default', { ascending: false });

  return <PaymentMethodsList initialMethods={methods ?? []} />;
}

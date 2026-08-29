import React from 'react';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import FinancialOverview from '../../components/financial-center/financial-overview';
import { Money } from '@caribbean/payments';

export const dynamic = 'force-dynamic';

export default async function FinancialCenterOverviewPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const [methodsRes, connectionsRes, accountsRes, creatorRes] = await Promise.all([
    supabase.from('payment_methods').select('id').eq('owner_id', user.id),
    supabase.from('payment_connections').select('id').eq('user_id', user.id).eq('connection_state', 'CONNECTED'),
    supabase.from('ledger_accounts').select('id, account_type, currency').eq('owner_id', user.id),
    supabase.from('creator_accounts').select('id').eq('profile_id', user.id).maybeSingle(),
  ]);

  const paymentMethodsCount = (methodsRes.data ?? []).length;
  const connectedProvidersCount = (connectionsRes.data ?? []).length;
  const accounts = accountsRes.data ?? [];
  const accountIds = accounts.map((a: { id: string }) => a.id);

  let recentTransactionsCount = 0;
  let creatorPendingMinor = 0;
  let creatorCurrency = 'USD';

  const creatorAccount = accounts.find((a: { account_type: string }) => a.account_type === 'creator_pending');
  if (creatorAccount) {
    creatorCurrency = creatorAccount.currency || 'USD';
  }

  if (accountIds.length > 0) {
    const { data: entries } = await supabase
      .from('ledger_entries')
      .select('id, amount, account_id, entry_type')
      .in('account_id', accountIds);

    const ledgerEntries = entries ?? [];
    recentTransactionsCount = ledgerEntries.length;

    if (creatorAccount) {
      const creatorEntries = ledgerEntries.filter((e: { account_id: string }) => e.account_id === creatorAccount.id);
      const totalAmount = creatorEntries.reduce((sum: number, e: { amount: number; entry_type: string }) => {
        const delta = e.entry_type === 'CREDIT' ? Number(e.amount) : -Number(e.amount);
        return sum + delta;
      }, 0);
      creatorPendingMinor = Math.max(0, Math.round(totalAmount * 100));
    }
  }

  const creatorMoney = new Money(creatorPendingMinor, creatorCurrency);

  return (
    <FinancialOverview
      paymentMethodsCount={paymentMethodsCount}
      connectedProvidersCount={connectedProvidersCount}
      recentTransactionsCount={recentTransactionsCount}
      activeSubscriptionsCount={0}
      creatorPendingFormatted={creatorMoney.format()}
      hasCreatorAccount={Boolean(creatorRes.data)}
    />
  );
}

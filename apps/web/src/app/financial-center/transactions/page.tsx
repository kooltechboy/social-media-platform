import React from 'react';
import {
  createSupabaseServerClient,
  getCurrentUser,
} from '../../../lib/supabase/server';
import TransactionHistoryTable, {
  type TransactionEntryView,
  type PaymentTransactionView,
} from '../../../components/financial-center/transaction-history-table';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  // 1. Fetch user payment_transactions (as payer or recipient)
  const [payTxRes, accountsRes] = await Promise.all([
    supabase
      .from('payment_transactions')
      .select('id, transaction_type, amount_minor, fee_amount_minor, net_amount_minor, currency, provider, state, model_type, payer_id, recipient_id, created_at')
      .or(`payer_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('ledger_accounts')
      .select('id, account_type, currency')
      .eq('owner_id', user.id),
  ]);

  const paymentTransactions: PaymentTransactionView[] = (payTxRes.data ?? []).map((t: any) => ({
    id: t.id,
    transactionType: t.transaction_type,
    amountMinor: Number(t.amount_minor || 0),
    feeAmountMinor: Number(t.fee_amount_minor || 0),
    netAmountMinor: Number(t.net_amount_minor || 0),
    currency: t.currency || 'USD',
    provider: t.provider || 'paypal',
    state: t.state || 'COMPLETED',
    modelType: (t.model_type as any) || 'MODEL_A',
    role: t.payer_id === user.id ? 'PAYER' : 'RECIPIENT',
    createdAt: t.created_at,
  }));

  // 2. Fetch double-entry ledger entries
  const userAccounts = accountsRes.data ?? [];
  const accountIds = userAccounts.map((a: any) => a.id);
  const accountTypeMap = new Map(
    userAccounts.map((a: any) => [a.id, a.account_type]),
  );
  const currencyMap = new Map(
    userAccounts.map((a: any) => [a.id, a.currency || 'USD']),
  );

  let entries: TransactionEntryView[] = [];

  if (accountIds.length > 0) {
    const { data: dbEntries } = await supabase
      .from('ledger_entries')
      .select(
        'id, transaction_id, account_id, amount, entry_type, description, created_at',
      )
      .in('account_id', accountIds)
      .order('created_at', { ascending: false })
      .limit(50);

    entries = (dbEntries ?? []).map((e: any) => ({
      id: e.id,
      transactionId: e.transaction_id,
      amountMinor: Number(e.amount),
      currency: currencyMap.get(e.account_id) || 'USD',
      entryType: e.entry_type,
      description: e.description,
      accountType: accountTypeMap.get(e.account_id) || 'account',
      createdAt: e.created_at,
    }));
  }

  return (
    <TransactionHistoryTable
      paymentTransactions={paymentTransactions}
      entries={entries}
    />
  );
}

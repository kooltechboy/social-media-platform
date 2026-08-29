import React from 'react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import TransactionHistoryTable, { type TransactionEntryView } from '../../../components/financial-center/transaction-history-table';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: accounts } = await supabase
    .from('ledger_accounts')
    .select('id, account_type, currency')
    .eq('owner_id', user.id);

  const userAccounts = accounts ?? [];
  const accountIds = userAccounts.map((a: any) => a.id);
  const accountTypeMap = new Map(userAccounts.map((a: any) => [a.id, a.account_type]));
  const currencyMap = new Map(userAccounts.map((a: any) => [a.id, a.currency || 'USD']));

  let entries: TransactionEntryView[] = [];

  if (accountIds.length > 0) {
    const { data: dbEntries } = await supabase
      .from('ledger_entries')
      .select('id, transaction_id, account_id, amount, entry_type, description, created_at')
      .in('account_id', accountIds)
      .order('created_at', { ascending: false })
      .limit(50);

    entries = (dbEntries ?? []).map((e: any) => ({
      id: e.id,
      transactionId: e.transaction_id,
      amountMinor: Math.round(Number(e.amount) * 100),
      currency: currencyMap.get(e.account_id) || 'USD',
      entryType: e.entry_type,
      description: e.description,
      accountType: accountTypeMap.get(e.account_id) || 'account',
      createdAt: e.created_at,
    }));
  }

  return <TransactionHistoryTable entries={entries} />;
}

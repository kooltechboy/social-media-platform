import React from "react";
import {
  createSupabaseServerClient,
  getCurrentUser,
} from "../../lib/supabase/server";
import FinancialOverview from "../../components/financial-center/financial-overview";
import { Money, sumLedgerMinorUnits } from "@caribbean/payments";

export const dynamic = "force-dynamic";

export default async function FinancialCenterOverviewPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const [methodsRes, connectionsRes, accountsRes, creatorRes] =
    await Promise.all([
      supabase.from("payment_methods").select("id").eq("owner_id", user.id),
      supabase
        .from("payment_connections")
        .select("id")
        .eq("user_id", user.id)
        .eq("connection_state", "CONNECTED"),
      supabase
        .from("ledger_accounts")
        .select("id, account_type, currency")
        .eq("owner_id", user.id),
      supabase
        .from("creator_accounts")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle(),
    ]);

  const paymentMethodsCount = (methodsRes.data ?? []).length;
  const connectedProvidersCount = (connectionsRes.data ?? []).length;
  const accounts = accountsRes.data ?? [];
  const accountIds = accounts.map((a: { id: string }) => a.id);

  let recentTransactionsCount = 0;
  let creatorPendingMinor = 0;
  let creatorCurrency = "USD";
  let activeSubscriptionsCount = 0;

  const creatorAccount = accounts.find(
    (a: { account_type: string }) => a.account_type === "creator_pending",
  );
  if (creatorAccount) {
    creatorCurrency = creatorAccount.currency || "USD";
  }

  // Fetch ledger entries and active subscriptions in parallel
  const fetchExtras = await Promise.all([
    accountIds.length > 0
      ? supabase
          .from("ledger_entries")
          .select("id, amount, account_id, entry_type")
          .in("account_id", accountIds)
      : Promise.resolve({ data: [] }),
    creatorRes.data?.id
      ? supabase
          .from("subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("creator_account_id", creatorRes.data.id)
          .eq("status", "active")
      : Promise.resolve({ count: 0 }),
  ]);

  const ledgerEntries = fetchExtras[0].data ?? [];
  recentTransactionsCount = ledgerEntries.length;
  activeSubscriptionsCount = fetchExtras[1].count ?? 0;

  if (creatorAccount) {
    const creatorEntries = ledgerEntries.filter(
      (e: { account_id: string }) => e.account_id === creatorAccount.id,
    );
    const totalAmount = sumLedgerMinorUnits(creatorEntries);
    creatorPendingMinor = Math.max(0, totalAmount);
  }

  const creatorMoney = new Money(creatorPendingMinor, creatorCurrency);

  return (
    <FinancialOverview
      paymentMethodsCount={paymentMethodsCount}
      connectedProvidersCount={connectedProvidersCount}
      recentTransactionsCount={recentTransactionsCount}
      activeSubscriptionsCount={activeSubscriptionsCount}
      creatorPendingFormatted={creatorMoney.format()}
      hasCreatorAccount={Boolean(creatorRes.data)}
    />
  );
}


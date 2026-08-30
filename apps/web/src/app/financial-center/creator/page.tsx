import React from "react";
import {
  createSupabaseServerClient,
  getCurrentUser,
} from "../../../lib/supabase/server";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  ArrowRight,
  DollarSign,
  Download,
} from "lucide-react";
import { Money, CREATOR_TIERS, sumLedgerMinorUnits } from "@caribbean/payments";

export const dynamic = "force-dynamic";

export default async function CreatorFinancialPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const [creatorRes, accountsRes, payoutsRes] = await Promise.all([
    supabase
      .from("creator_accounts")
      .select("id, kyc_status, is_verified, payout_threshold_minor")
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabase
      .from("ledger_accounts")
      .select("id, account_type, currency")
      .eq("owner_id", user.id)
      .eq("account_type", "creator_pending")
      .maybeSingle(),
    supabase
      .from("payouts")
      .select("id, amount_minor, currency, state, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const creatorAccount = creatorRes.data;
  const pendingLedger = accountsRes.data;
  const payouts = payoutsRes.data ?? [];

  let pendingMinor = 0;
  const currency = pendingLedger?.currency || "USD";

  if (pendingLedger) {
    const { data: entries } = await supabase
      .from("ledger_entries")
      .select("amount, entry_type")
      .eq("account_id", pendingLedger.id);

    const total = sumLedgerMinorUnits(entries ?? []);
    pendingMinor = Math.max(0, total);
  }

  const pendingMoney = new Money(pendingMinor, currency);
  const thresholdMinor = creatorAccount?.payout_threshold_minor || 5000;
  const thresholdMoney = new Money(thresholdMinor, currency);
  const isEligibleForPayout =
    pendingMinor >= thresholdMinor && creatorAccount?.kyc_status === "verified";

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-goldenHour" /> Creator
          Financial Dashboard
        </h2>
        <p className="text-xs text-slate-400">
          Monetization metrics, fan patronage revenue, and verified bank payout
          schedules.
        </p>
      </div>

      {!creatorAccount ? (
        <div className="p-6 rounded-2xl bg-brand-dusk/60 border border-slate-800 text-center space-y-3">
          <h3 className="text-base font-bold text-white">
            Unlock Creator Monetization
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Enable fan subscriptions, live broadcast tipping, and affiliate
            referrals on your Caribbean content.
          </p>
          <Link
            href="/creator-studio"
            className="inline-block px-5 py-2.5 rounded-xl bg-brand-sunriseCoral text-slate-950 font-black text-xs hover:opacity-95 transition-opacity"
          >
            Open Creator Studio →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-brand-dusk/70 border border-brand-sunriseCoral/40 space-y-2">
              <span className="text-[11px] font-bold uppercase text-brand-sunriseCoral tracking-wider">
                Available for Payout
              </span>
              <div className="text-2xl font-black text-white">
                {pendingMoney.format()}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />{" "}
                Double-entry verified
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-brand-dusk/70 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                KYC Verification
              </span>
              <div className="text-lg font-black capitalize text-white">
                {creatorAccount.kyc_status}
              </div>
              <p className="text-[11px] text-slate-400">
                {creatorAccount.kyc_status === "verified"
                  ? "Identity verified for payouts"
                  : "Submit identity document to unlock payouts"}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-brand-dusk/70 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Minimum Payout Threshold
              </span>
              <div className="text-lg font-black text-white">
                {thresholdMoney.format()}
              </div>
              <p className="text-[11px] text-slate-400">
                Standard Caribbean settlement rail
              </p>
            </div>
          </div>

          {/* Monetization Tier Structure */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">
              Creator Tier Monetization Rates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {Object.values(CREATOR_TIERS).map((tier) => (
                <div
                  key={tier.id}
                  className="p-3.5 rounded-xl bg-brand-dusk/80 border border-slate-800 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">
                      {tier.name}
                    </span>
                    <span className="text-[10px] font-black text-brand-goldenHour">
                      {tier.priceMinor === 0
                        ? "Free"
                        : `$${(tier.priceMinor / 100).toFixed(2)}/mo`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Platform Fee: <strong>{tier.platformFeeBps / 100}%</strong>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Example on $50 Fan Tip:</span>
              <span>Creator Free: <strong>$45.00 net</strong> • Creator Plus: <strong>$47.50 net</strong> • Creator Pro: <strong>$50.00 net</strong></span>
            </div>
          </div>

          {/* Recent Payout Disbursements */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">
              Recent Payout History
            </h3>
            {payouts.length === 0 ? (
              <div className="p-4 rounded-xl bg-brand-dusk/40 border border-slate-800 text-xs text-slate-400 text-center">
                No past payout disbursements.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Payout ID</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-brand-dusk/60">
                    {payouts.map((p: any) => (
                      <tr key={p.id}>
                        <td className="p-3 font-mono text-[10px] text-slate-400">
                          {p.id.slice(0, 8)}…
                        </td>
                        <td className="p-3 font-bold text-white">
                          ${(p.amount_minor / 100).toFixed(2)}
                        </td>
                        <td className="p-3 capitalize">{p.state}</td>
                        <td className="p-3 text-slate-400">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

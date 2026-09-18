import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Only allow POST requests (triggered by pg_cron or manual invocation)
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Auth: require service role key in Authorization header
  const authHeader = req.headers.get('Authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!authHeader || !serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 1); // yesterday

  try {
    // 1. Fetch ledger entries for the period
    const { data: ledgerEntries, error: ledgerError } = await supabase
      .from('ledger_entries')
      .select('*')
      .gte('created_at', periodStart.toISOString())
      .lt('created_at', periodEnd.toISOString());
    
    if (ledgerError) throw ledgerError;

    // 2. Fetch payment_intents that succeeded in this period  
    const { data: intents, error: intentsError } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('status', 'succeeded')
      .gte('updated_at', periodStart.toISOString())
      .lt('updated_at', periodEnd.toISOString());
    
    if (intentsError) throw intentsError;

    // 3. Basic reconciliation: every succeeded intent should have corresponding ledger entries
    const discrepancies: string[] = [];
    
    for (const intent of (intents ?? [])) {
      const relatedEntries = (ledgerEntries ?? []).filter(
        (e: { reference_id?: string }) => e.reference_id === intent.id
      );
      if (relatedEntries.length === 0) {
        discrepancies.push(`Intent ${intent.id} (${intent.amount_minor} ${intent.currency}) has no ledger entries`);
      }
    }

    const status = discrepancies.length === 0 ? 'RECONCILED' : 'DISCREPANCY_DETECTED';

    // 4. Write report
    await supabase.from('reconciliation_reports').insert({
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      status,
      total_ledger_entries: ledgerEntries?.length ?? 0,
      total_gateway_records: intents?.length ?? 0,
      discrepancy_count: discrepancies.length,
      report_json: { discrepancies },
    });

    if (status === 'DISCREPANCY_DETECTED') {
      console.error('[reconcile-daily] DISCREPANCY DETECTED:', discrepancies);
    }

    return new Response(JSON.stringify({ status, discrepancyCount: discrepancies.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[reconcile-daily] Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});

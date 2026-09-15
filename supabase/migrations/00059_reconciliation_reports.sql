-- Reconciliation reports table
CREATE TABLE IF NOT EXISTS reconciliation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('RECONCILED', 'DISCREPANCY_DETECTED', 'ERROR')),
  total_ledger_entries INTEGER DEFAULT 0,
  total_gateway_records INTEGER DEFAULT 0,
  discrepancy_count INTEGER DEFAULT 0,
  report_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: deny all client access (service-role only)
ALTER TABLE reconciliation_reports ENABLE ROW LEVEL SECURITY;
-- No policies = deny all

-- Index for recent runs
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_run_at ON reconciliation_reports(run_at DESC);

-- Ensure pg_cron and pg_net extensions are enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Unschedule existing job if already scheduled to allow idempotent re-runs
DO $$
BEGIN
    PERFORM cron.unschedule('daily-reconciliation');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Schedule daily reconciliation at 2 AM UTC
SELECT cron.schedule(
  'daily-reconciliation',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/reconcile-daily',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
    body := '{}'
  );
  $$
);

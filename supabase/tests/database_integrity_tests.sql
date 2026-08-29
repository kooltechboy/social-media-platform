-- Database integrity verification for migration 00033.
-- Run after applying all migrations:
--   psql "$SUPABASE_DB_URL" -f supabase/tests/database_integrity_tests.sql

BEGIN;

DO $$
DECLARE
  amount_type text;
  trigger_is_deferred boolean;
  trigger_is_initially_deferred boolean;
  first_account uuid;
  second_account uuid;
  tx_id uuid := gen_random_uuid();
  failed boolean := false;
BEGIN
  SELECT data_type INTO amount_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'ledger_entries'
    AND column_name = 'amount';

  IF amount_type <> 'bigint' THEN
    RAISE EXCEPTION 'DATABASE INTEGRITY FAILURE: ledger amount type is %, expected bigint', amount_type;
  END IF;

  SELECT t.tgdeferrable, t.tginitdeferred
  INTO trigger_is_deferred, trigger_is_initially_deferred
  FROM pg_trigger t
  JOIN pg_proc p ON p.oid = t.tgfoid
  WHERE t.tgrelid = 'public.ledger_entries'::regclass
    AND t.tgname = 'trg_ledger_sum_zero';

  IF trigger_is_deferred IS DISTINCT FROM true
     OR trigger_is_initially_deferred IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'DATABASE INTEGRITY FAILURE: ledger trigger is not deferred';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_methods'
      AND policyname = 'Owner updates payment methods'
      AND with_check LIKE '%auth.uid()%'
  ) THEN
    RAISE EXCEPTION 'DATABASE INTEGRITY FAILURE: payment method owner UPDATE check missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_connections'
      AND policyname = 'User updates own connections'
      AND with_check LIKE '%auth.uid()%'
  ) THEN
    RAISE EXCEPTION 'DATABASE INTEGRITY FAILURE: payment connection owner UPDATE check missing';
  END IF;

  SELECT id INTO first_account FROM public.ledger_accounts ORDER BY id LIMIT 1;
  SELECT id INTO second_account FROM public.ledger_accounts WHERE id <> first_account ORDER BY id LIMIT 1;

  IF first_account IS NULL OR second_account IS NULL THEN
    RAISE NOTICE 'Ledger trigger data test skipped: fewer than two ledger accounts exist';
    RETURN;
  END IF;

  BEGIN
    INSERT INTO public.ledger_entries (transaction_id, account_id, amount, entry_type, idempotency_key)
    VALUES (tx_id, first_account, 1, 'CREDIT', 'db-integrity-unbalanced-' || tx_id);
    SET CONSTRAINTS trg_ledger_sum_zero DEFERRED;
    SET CONSTRAINTS trg_ledger_sum_zero IMMEDIATE;
  EXCEPTION WHEN OTHERS THEN
    failed := true;
  END;

  IF NOT failed THEN
    RAISE EXCEPTION 'DATABASE INTEGRITY FAILURE: unbalanced transaction was accepted';
  END IF;

  INSERT INTO public.ledger_entries (transaction_id, account_id, amount, entry_type, idempotency_key)
  VALUES
    (tx_id, first_account, -125, 'DEBIT', 'db-integrity-balanced-debit-' || tx_id),
    (tx_id, second_account, 125, 'CREDIT', 'db-integrity-balanced-credit-' || tx_id);

  IF (SELECT SUM(amount) FROM public.ledger_entries WHERE transaction_id = tx_id) <> 0 THEN
    RAISE EXCEPTION 'DATABASE INTEGRITY FAILURE: balanced transaction does not sum to zero';
  END IF;
END $$;

ROLLBACK;

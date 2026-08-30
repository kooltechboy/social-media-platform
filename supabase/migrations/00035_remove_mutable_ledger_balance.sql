-- Migration 00035: Remove mutable ledger balance column
-- Description: Drops the running `balance` column and its update trigger from
--   ledger_accounts. This column was introduced in 00019 and violates the
--   AGENTS.md financial ledger mandate:
--     "Never alter wallet balances with mutable column increments (balance = balance + X).
--      Every monetary transaction must be executed via paired double-entry
--      credit/debit records with idempotency keys."
--
-- Balances MUST be calculated by aggregating ledger_entries via sumLedgerMinorUnits().
-- No application code queries ledger_accounts.balance (confirmed by grep 2026-08-29).

-- 1. Remove the prohibited trigger first
DROP TRIGGER IF EXISTS trg_update_ledger_balance ON public.ledger_entries;

-- 2. Remove the prohibited trigger function
DROP FUNCTION IF EXISTS public.update_ledger_account_balance();

-- 3. Drop the mutable balance column
ALTER TABLE public.ledger_accounts DROP COLUMN IF EXISTS balance;

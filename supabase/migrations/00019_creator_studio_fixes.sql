-- Migration 00019: Creator Studio Ledger Fixes
-- Description: Adds running balance to ledger_accounts and lifecycle triggers

-- 1. Add running balance to ledger accounts
ALTER TABLE public.ledger_accounts ADD COLUMN balance NUMERIC(18, 4) DEFAULT 0 NOT NULL;

-- 2. Trigger to update running balance on new ledger entries
CREATE OR REPLACE FUNCTION public.update_ledger_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.ledger_accounts
    SET balance = balance + NEW.amount
    WHERE id = NEW.account_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_ledger_balance
AFTER INSERT ON public.ledger_entries
FOR EACH ROW EXECUTE FUNCTION public.update_ledger_account_balance();

-- 3. Trigger to auto-create creator_pending ledger account for new creators
CREATE OR REPLACE FUNCTION public.auto_create_creator_pending_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.ledger_accounts (owner_id, account_type, currency)
    VALUES (NEW.profile_id, 'creator_pending', 'USD');
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_creator_ledger
AFTER INSERT ON public.creator_accounts
FOR EACH ROW EXECUTE FUNCTION public.auto_create_creator_pending_ledger();

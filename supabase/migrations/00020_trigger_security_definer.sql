-- Migration 00020: Secure Triggers for Ledger
-- Description: Adds SECURITY DEFINER to ledger triggers so they can bypass RLS when invoked by client actions

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

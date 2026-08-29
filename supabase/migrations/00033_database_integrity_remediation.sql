-- Migration 00033: Database integrity remediation
-- Ledger amounts are stored as signed integer minor units.

-- Existing ledger values are NUMERIC(18,4) major units. Refuse values that
-- cannot be represented exactly as cents before converting the column.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.ledger_entries
        WHERE amount * 100 <> trunc(amount * 100)
    ) THEN
        RAISE EXCEPTION 'Ledger migration refused: an amount is not an exact minor-unit value';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.ledger_entries
        WHERE amount * 100 > 9223372036854775807
           OR amount * 100 < -9223372036854775808
    ) THEN
        RAISE EXCEPTION 'Ledger migration refused: an amount exceeds BIGINT minor-unit range';
    END IF;
END $$;

ALTER TABLE public.ledger_entries
    ALTER COLUMN amount TYPE BIGINT
    USING (amount * 100)::BIGINT;

-- Replace 00011's immediate row trigger. A paired insert is validated only
-- after all rows in its transaction are visible.
DROP TRIGGER IF EXISTS trg_ledger_sum_zero ON public.ledger_entries;

CREATE OR REPLACE FUNCTION public.enforce_ledger_sum_zero()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    affected_transaction UUID;
    transaction_total NUMERIC;
BEGIN
    FOR affected_transaction IN
        SELECT DISTINCT transaction_id
        FROM unnest(ARRAY[
            CASE WHEN TG_OP <> 'INSERT' THEN OLD.transaction_id ELSE NULL END,
            CASE WHEN TG_OP <> 'DELETE' THEN NEW.transaction_id ELSE NULL END
        ]) AS tx(transaction_id)
        WHERE transaction_id IS NOT NULL
    LOOP
        SELECT COALESCE(SUM(amount), 0)
        INTO transaction_total
        FROM public.ledger_entries
        WHERE transaction_id = affected_transaction;

        IF transaction_total <> 0 THEN
            RAISE EXCEPTION 'Ledger invariant violated: transaction % does not sum to zero', affected_transaction;
        END IF;
    END LOOP;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_ledger_sum_zero
AFTER INSERT OR UPDATE OR DELETE ON public.ledger_entries
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.enforce_ledger_sum_zero();

-- Owner UPDATE policies must preserve ownership after the update.
DROP POLICY IF EXISTS "Owner updates payment methods" ON public.payment_methods;
CREATE POLICY "Owner updates payment methods" ON public.payment_methods
    FOR UPDATE
    USING ((SELECT auth.uid()) = owner_id)
    WITH CHECK ((SELECT auth.uid()) = owner_id);

DROP POLICY IF EXISTS "User updates own connections" ON public.payment_connections;
CREATE POLICY "User updates own connections" ON public.payment_connections
    FOR UPDATE
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- Provider state and identifiers are provider-controlled, not client-controlled.
CREATE OR REPLACE FUNCTION public.prevent_client_payment_connection_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    IF current_user IN ('anon', 'authenticated')
       AND (
           OLD.connection_state IS DISTINCT FROM NEW.connection_state
           OR OLD.provider_id IS DISTINCT FROM NEW.provider_id
           OR OLD.provider_account_id IS DISTINCT FROM NEW.provider_account_id
       ) THEN
        RAISE EXCEPTION 'Payment connection state and provider identifiers are provider-controlled';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_client_payment_connection_mutation ON public.payment_connections;
CREATE TRIGGER trg_prevent_client_payment_connection_mutation
BEFORE UPDATE ON public.payment_connections
FOR EACH ROW EXECUTE FUNCTION public.prevent_client_payment_connection_mutation();

-- Public identity rows are country-level only. Owners retain access to their
-- own precise fields; followers have no implicit access to private identity.
DROP POLICY IF EXISTS "Owner read own identity" ON public.profile_identity;
DROP POLICY IF EXISTS "Owner update own identity" ON public.profile_identity;
DROP POLICY IF EXISTS "Geographic data minimization" ON public.profile_identity;

CREATE POLICY "Owner reads own identity" ON public.profile_identity
    FOR SELECT
    USING ((SELECT auth.uid()) = profile_id);

CREATE POLICY "Public reads country-level identity" ON public.profile_identity
    FOR SELECT
    USING (
        visibility = 'public'
        AND origin_country_iso IS NOT NULL
        AND origin_region_id IS NULL
        AND origin_city_id IS NULL
        AND current_city_id IS NULL
        AND diaspora_hub_id IS NULL
    );

CREATE POLICY "Owner manages own identity" ON public.profile_identity
    FOR ALL
    USING ((SELECT auth.uid()) = profile_id)
    WITH CHECK (
        (SELECT auth.uid()) = profile_id
        AND (
            visibility <> 'public'
            OR (
                origin_country_iso IS NOT NULL
                AND origin_region_id IS NULL
                AND origin_city_id IS NULL
                AND current_city_id IS NULL
                AND diaspora_hub_id IS NULL
            )
        )
    );

-- RLS predicate support indexes.
CREATE INDEX IF NOT EXISTS idx_payment_connections_user_state
    ON public.payment_connections(user_id, connection_state);
CREATE INDEX IF NOT EXISTS idx_profile_identity_public_country
    ON public.profile_identity(visibility, origin_country_iso)
    WHERE visibility = 'public'
      AND origin_region_id IS NULL
      AND origin_city_id IS NULL
      AND current_city_id IS NULL
      AND diaspora_hub_id IS NULL;

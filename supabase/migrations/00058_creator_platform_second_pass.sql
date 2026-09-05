-- Migration 00058: Creator Platform Second-Pass Security & Live Engagement Hardening
-- Description: Enhances live_gifts readability for live/ended streams, adds deletion and
--              moderation policies for live_messages, and provides creator gift earnings aggregation.

-- =============================================================================
-- 1. LIVE GIFTS RLS POLICY REINFORCEMENT
-- =============================================================================
-- Stream viewers can see gifts during live streams and stream archives;
-- senders and stream hosts can always access their gift records.

DROP POLICY IF EXISTS "Stream participants read gifts" ON public.live_gifts;
CREATE POLICY "Stream participants read gifts" ON public.live_gifts
    FOR SELECT
    USING (
        sender_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.livestreams s
            WHERE s.id = livestream_id
              AND (s.creator_id = auth.uid() OR s.state IN ('live', 'ended'))
        )
    );

DROP POLICY IF EXISTS "Senders create gifts" ON public.live_gifts;
CREATE POLICY "Senders create gifts" ON public.live_gifts
    FOR INSERT
    WITH CHECK (sender_id = auth.uid());

-- =============================================================================
-- 2. LIVE MESSAGES DELETION & MODERATION POLICIES
-- =============================================================================
-- Allows stream hosts (moderators) and original senders to remove/delete messages.

DROP POLICY IF EXISTS "Creator and sender delete chat" ON public.live_messages;
CREATE POLICY "Creator and sender delete chat" ON public.live_messages
    FOR DELETE
    USING (
        sender_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.livestreams s
            WHERE s.id = livestream_id AND s.creator_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Creator removes chat" ON public.live_messages;
CREATE POLICY "Creator removes chat" ON public.live_messages
    FOR UPDATE
    USING (
        sender_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.livestreams s
            WHERE s.id = livestream_id AND s.creator_id = auth.uid()
        )
    )
    WITH CHECK (
        sender_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.livestreams s
            WHERE s.id = livestream_id AND s.creator_id = auth.uid()
        )
    );

-- =============================================================================
-- 3. CREATOR LIVE GIFT REVENUE AGGREGATION RPC
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_creator_gift_earnings(p_creator_id UUID)
RETURNS TABLE (
    total_gifts_count BIGINT,
    total_revenue_minor BIGINT,
    currency VARCHAR(3)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(g.id)::BIGINT AS total_gifts_count,
        COALESCE(SUM(g.price_minor), 0)::BIGINT AS total_revenue_minor,
        COALESCE(MIN(g.currency), 'USD')::VARCHAR(3) AS currency
    FROM public.live_gifts g
    JOIN public.livestreams s ON s.id = g.livestream_id
    WHERE s.creator_id = p_creator_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_creator_gift_earnings(UUID) TO authenticated;

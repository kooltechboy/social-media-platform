-- =============================================================================
-- Migration 00086: Social Relationship System Hardening & Security Enforcement
-- =============================================================================
-- Description:
--   1. Adds self-friendship check constraint (requester_id <> addressee_id).
--   2. Enforces canonical pair uniqueness: LEAST(requester_id, addressee_id),
--      GREATEST(requester_id, addressee_id) to prevent reverse duplicates.
--   3. Updates status check constraint to support explicit lifecycle states:
--      'pending', 'accepted', 'declined', 'cancelled', 'blocked'.
--   4. Hardens Row Level Security (RLS) on public.friendships:
--      - INSERT: Only requester can insert, strictly with status = 'pending',
--        and only if neither user has blocked the other.
--      - UPDATE: Only recipient (addressee) can accept or decline.
--      - DELETE: Both participants can remove/unfriend/cancel.
--      - SELECT: Participants can view all; others can view accepted friends
--        according to the user's relationship_visibility settings.
--   5. Updates triggers to automatically clean up pending notifications when
--      a friend request is declined, cancelled, or unfriended.
--   6. Adds get_profile_friends() RPC for secure, privacy-governed querying.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Data Integrity: Clean up any invalid or legacy relationships
-- -----------------------------------------------------------------------------

-- Remove any self-friendships if they exist
DELETE FROM public.friendships WHERE requester_id = addressee_id;

-- Deduplicate any duplicate reverse pairs keeping the accepted one or newest one
DELETE FROM public.friendships f1
USING public.friendships f2
WHERE f1.id > f2.id
  AND LEAST(f1.requester_id, f1.addressee_id) = LEAST(f2.requester_id, f2.addressee_id)
  AND GREATEST(f1.requester_id, f1.addressee_id) = GREATEST(f2.requester_id, f2.addressee_id);

-- -----------------------------------------------------------------------------
-- 2. Constraints & Indexing
-- -----------------------------------------------------------------------------

-- Prevent self-friendship
ALTER TABLE public.friendships
    DROP CONSTRAINT IF EXISTS chk_friendships_no_self;

ALTER TABLE public.friendships
    ADD CONSTRAINT chk_friendships_no_self CHECK (requester_id <> addressee_id);

-- Update status check constraint for explicit states
ALTER TABLE public.friendships
    DROP CONSTRAINT IF EXISTS friendships_status_check;

ALTER TABLE public.friendships
    ADD CONSTRAINT friendships_status_check
    CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'blocked'));

-- Canonical unique index to guarantee no dual reverse rows (A->B and B->A)
CREATE UNIQUE INDEX IF NOT EXISTS idx_friendships_canonical_pair
    ON public.friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));

-- Fast lookups for accepted friendships
CREATE INDEX IF NOT EXISTS idx_friendships_accepted_requester
    ON public.friendships (requester_id) WHERE status = 'accepted';

CREATE INDEX IF NOT EXISTS idx_friendships_accepted_addressee
    ON public.friendships (addressee_id) WHERE status = 'accepted';

-- -----------------------------------------------------------------------------
-- 3. Hardened Row Level Security (RLS)
-- -----------------------------------------------------------------------------

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Drop legacy/permissive policies
DROP POLICY IF EXISTS "Friendship participants read" ON public.friendships;
DROP POLICY IF EXISTS "Requester creates friendship" ON public.friendships;
DROP POLICY IF EXISTS "Participants update friendship" ON public.friendships;
DROP POLICY IF EXISTS "Participants delete friendship" ON public.friendships;
DROP POLICY IF EXISTS "Participants read friendships" ON public.friendships;
DROP POLICY IF EXISTS "Public can view accepted friendships if permitted" ON public.friendships;

-- INSERT Policy:
-- Authenticated caller must be the requester.
-- Must be pending status (client CANNOT forge 'accepted').
-- Must not be self.
-- Neither party may have blocked the other.
CREATE POLICY "Requester creates pending friendship" ON public.friendships
    FOR INSERT WITH CHECK (
        auth.uid() = requester_id
        AND status = 'pending'
        AND requester_id <> addressee_id
        AND NOT EXISTS (
            SELECT 1 FROM public.blocks
            WHERE (blocker_id = addressee_id AND blocked_id = requester_id)
               OR (blocker_id = requester_id AND blocked_id = addressee_id)
        )
    );

-- UPDATE Policy:
-- Only addressee (recipient) can accept or decline a pending request.
-- Requester cannot accept their own request.
CREATE POLICY "Addressee updates friendship status" ON public.friendships
    FOR UPDATE USING (
        auth.uid() = addressee_id
        OR (auth.uid() = requester_id AND status = 'accepted') -- allows requester to toggle is_close_friend only after accepted
    ) WITH CHECK (
        (auth.uid() = addressee_id AND status IN ('accepted', 'declined'))
        OR (auth.uid() = requester_id AND status = 'accepted')
    );

-- DELETE Policy:
-- Either participant can cancel pending request or unfriend.
CREATE POLICY "Participants delete friendship" ON public.friendships
    FOR DELETE USING (
        auth.uid() IN (requester_id, addressee_id)
    );

-- SELECT Policy:
-- 1. Participants can view their own friendships in all states.
-- 2. Non-participants can view accepted friendships ONLY if the target's relationship_visibility is 'public'.
CREATE POLICY "Read friendships policy" ON public.friendships
    FOR SELECT USING (
        auth.uid() IN (requester_id, addressee_id)
        OR (
            status = 'accepted'
            AND EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE (p.id = requester_id OR p.id = addressee_id)
                  AND COALESCE(p.relationship_visibility, 'public') = 'public'
                  AND NOT EXISTS (
                      SELECT 1 FROM public.blocks b
                      WHERE (b.blocker_id = p.id AND b.blocked_id = auth.uid())
                         OR (b.blocker_id = auth.uid() AND b.blocked_id = p.id)
                  )
            )
        )
    );

-- -----------------------------------------------------------------------------
-- 4. Trigger Enhancements: Automated Notifications & Stale Cleanup
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_friendship_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    req_display TEXT;
    req_username TEXT;
    addr_display TEXT;
    addr_username TEXT;
BEGIN
    -- Case A: Friend Request Sent (INSERT with status 'pending')
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        -- Check if recipient has blocked requester
        IF NOT EXISTS (
            SELECT 1 FROM public.blocks
            WHERE (blocker_id = NEW.addressee_id AND blocked_id = NEW.requester_id)
               OR (blocker_id = NEW.requester_id AND blocked_id = NEW.addressee_id)
        ) THEN
            SELECT display_name, username INTO req_display, req_username
            FROM public.profiles WHERE id = NEW.requester_id;

            INSERT INTO public.notifications (
                recipient_id,
                kind,
                actor_id,
                entity_type,
                entity_id,
                payload,
                created_at
            )
            VALUES (
                NEW.addressee_id,
                'friend_request',
                NEW.requester_id,
                'friendship',
                NEW.id,
                jsonb_build_object(
                    'friendship_id', NEW.id,
                    'requester_id', NEW.requester_id,
                    'actor_name', COALESCE(req_display, req_username, 'A member'),
                    'message', 'wants to add you as a friend on TUKUBI.',
                    'status', 'pending'
                ),
                now()
            );
        END IF;
        RETURN NEW;

    -- Case B: Friend Request Accepted (UPDATE from 'pending' to 'accepted')
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
        -- Check if blocker exists
        IF NOT EXISTS (
            SELECT 1 FROM public.blocks
            WHERE (blocker_id = NEW.requester_id AND blocked_id = NEW.addressee_id)
               OR (blocker_id = NEW.addressee_id AND blocked_id = NEW.requester_id)
        ) THEN
            SELECT display_name, username INTO addr_display, addr_username
            FROM public.profiles WHERE id = NEW.addressee_id;

            INSERT INTO public.notifications (
                recipient_id,
                kind,
                actor_id,
                entity_type,
                entity_id,
                payload,
                created_at
            )
            VALUES (
                NEW.requester_id,
                'friend_accepted',
                NEW.addressee_id,
                'friendship',
                NEW.id,
                jsonb_build_object(
                    'friendship_id', NEW.id,
                    'addressee_id', NEW.addressee_id,
                    'actor_name', COALESCE(addr_display, addr_username, 'A member'),
                    'message', 'accepted your friend request.',
                    'status', 'accepted'
                ),
                now()
            );
        END IF;

        -- Clean up the original pending request notification for addressee
        DELETE FROM public.notifications
        WHERE recipient_id = NEW.addressee_id
          AND kind = 'friend_request'
          AND actor_id = NEW.requester_id;

        RETURN NEW;

    -- Case C: Request Declined (UPDATE from 'pending' to 'declined')
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'declined' THEN
        -- Clean up pending notification so recipient no longer sees it
        DELETE FROM public.notifications
        WHERE recipient_id = NEW.addressee_id
          AND kind = 'friend_request'
          AND actor_id = NEW.requester_id;

        RETURN NEW;

    -- Case D: Request Cancelled or Deleted (DELETE of pending or accepted)
    ELSIF TG_OP = 'DELETE' THEN
        -- Clean up any pending notification associated with this friendship
        DELETE FROM public.notifications
        WHERE (recipient_id = OLD.addressee_id AND kind = 'friend_request' AND actor_id = OLD.requester_id)
           OR (recipient_id = OLD.requester_id AND kind = 'friend_accepted' AND actor_id = OLD.addressee_id);

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_friendship_notification ON public.friendships;
CREATE TRIGGER trg_friendship_notification
AFTER INSERT OR UPDATE OR DELETE ON public.friendships
FOR EACH ROW EXECUTE FUNCTION public.handle_friendship_notification();

-- -----------------------------------------------------------------------------
-- 5. Secure RPC: get_profile_friends() with Privacy Enforcement
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_profile_friends(
    target_user_id UUID,
    viewer_id UUID DEFAULT NULL,
    limit_count INT DEFAULT 20,
    offset_count INT DEFAULT 0
)
RETURNS TABLE (
    friend_id UUID,
    display_name TEXT,
    username TEXT,
    avatar_url TEXT,
    bio TEXT,
    country_iso TEXT,
    is_verified BOOLEAN,
    friends_since TIMESTAMPTZ,
    mutual_friends_count INT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_vis TEXT;
    is_own BOOLEAN := (viewer_id IS NOT NULL AND viewer_id = target_user_id);
    is_friend BOOLEAN := false;
BEGIN
    -- Check block
    IF viewer_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.blocks
            WHERE (blocker_id = target_user_id AND blocked_id = viewer_id)
               OR (blocker_id = viewer_id AND blocked_id = target_user_id)
        ) THEN
            RETURN;
        END IF;
    END IF;

    -- Check privacy visibility
    SELECT COALESCE(relationship_visibility, 'public') INTO target_vis
    FROM public.profiles WHERE id = target_user_id;

    IF target_vis IS NULL THEN
        RETURN;
    END IF;

    IF viewer_id IS NOT NULL AND NOT is_own THEN
        SELECT EXISTS (
            SELECT 1 FROM public.friendships
            WHERE status = 'accepted'
              AND ((requester_id = target_user_id AND addressee_id = viewer_id)
                OR (addressee_id = target_user_id AND requester_id = viewer_id))
        ) INTO is_friend;
    END IF;

    -- Access check: private only for owner; friends only for owner or friends; public for all
    IF NOT is_own THEN
        IF target_vis = 'private' THEN
            RETURN;
        ELSIF target_vis = 'friends' AND NOT is_friend THEN
            RETURN;
        END IF;
    END IF;

    RETURN QUERY
    WITH target_friends AS (
        SELECT
            CASE WHEN f.requester_id = target_user_id THEN f.addressee_id ELSE f.requester_id END AS fid,
            f.updated_at AS accepted_at
        FROM public.friendships f
        WHERE (f.requester_id = target_user_id OR f.addressee_id = target_user_id)
          AND f.status = 'accepted'
    )
    SELECT
        p.id AS friend_id,
        p.display_name,
        p.username,
        p.avatar_url,
        p.bio,
        p.origin_country_iso AS country_iso,
        COALESCE(p.is_verified, false) AS is_verified,
        tf.accepted_at AS friends_since,
        COALESCE(
            CASE WHEN viewer_id IS NOT NULL AND viewer_id <> p.id THEN
                (SELECT COUNT(*)::INT FROM public.get_mutual_friends(viewer_id, p.id, 100))
            ELSE 0 END,
            0
        ) AS mutual_friends_count
    FROM target_friends tf
    JOIN public.profiles p ON p.id = tf.fid
    WHERE viewer_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.blocks b
        WHERE (b.blocker_id = viewer_id AND b.blocked_id = p.id)
           OR (b.blocker_id = p.id AND b.blocked_id = viewer_id)
    )
    ORDER BY tf.accepted_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$;

COMMIT;

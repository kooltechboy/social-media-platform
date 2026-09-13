-- =============================================================================
-- Migration 00078: Social Graph Relationships, Friends Counts & Notifications
-- =============================================================================
-- Description:
--   1. Adds denormalized `friends_count` to `public.profile_counts`.
--   2. Backfills `friends_count` from existing accepted friendships.
--   3. Triggers for monotonic `friends_count` sync on insert, update, and delete.
--   4. Triggers for automated social notifications:
--      - Friend request received (`friend_request`)
--      - Friend request accepted (`friend_accepted`)
--      - New follower (`follow`)
--   5. Fast mutual friends RPC function.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. Profile Counts Extension: friends_count
-- =============================================================================

ALTER TABLE public.profile_counts
    ADD COLUMN IF NOT EXISTS friends_count INTEGER NOT NULL DEFAULT 0;

-- Backfill friends_count for existing profiles from accepted friendships
WITH counts AS (
    SELECT profile_id, COUNT(*) AS f_count
    FROM (
        SELECT requester_id AS profile_id FROM public.friendships WHERE status = 'accepted'
        UNION ALL
        SELECT addressee_id AS profile_id FROM public.friendships WHERE status = 'accepted'
    ) all_friends
    GROUP BY profile_id
)
UPDATE public.profile_counts pc
SET friends_count = counts.f_count,
    updated_at = now()
FROM counts
WHERE pc.profile_id = counts.profile_id;

-- =============================================================================
-- 2. Trigger: Synchronize friends_count on public.friendships changes
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_friendship_count_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'accepted' THEN
            -- Increment for requester
            INSERT INTO public.profile_counts (profile_id, friends_count, updated_at)
            VALUES (NEW.requester_id, 1, now())
            ON CONFLICT (profile_id) DO UPDATE
                SET friends_count = public.profile_counts.friends_count + 1,
                    updated_at = now();

            -- Increment for addressee
            INSERT INTO public.profile_counts (profile_id, friends_count, updated_at)
            VALUES (NEW.addressee_id, 1, now())
            ON CONFLICT (profile_id) DO UPDATE
                SET friends_count = public.profile_counts.friends_count + 1,
                    updated_at = now();
        END IF;
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Status changed to accepted
        IF OLD.status <> 'accepted' AND NEW.status = 'accepted' THEN
            INSERT INTO public.profile_counts (profile_id, friends_count, updated_at)
            VALUES (NEW.requester_id, 1, now())
            ON CONFLICT (profile_id) DO UPDATE
                SET friends_count = public.profile_counts.friends_count + 1,
                    updated_at = now();

            INSERT INTO public.profile_counts (profile_id, friends_count, updated_at)
            VALUES (NEW.addressee_id, 1, now())
            ON CONFLICT (profile_id) DO UPDATE
                SET friends_count = public.profile_counts.friends_count + 1,
                    updated_at = now();

        -- Status changed from accepted to declined or pending
        ELSIF OLD.status = 'accepted' AND NEW.status <> 'accepted' THEN
            UPDATE public.profile_counts
            SET friends_count = GREATEST(friends_count - 1, 0),
                updated_at = now()
            WHERE profile_id IN (OLD.requester_id, OLD.addressee_id);
        END IF;
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status = 'accepted' THEN
            UPDATE public.profile_counts
            SET friends_count = GREATEST(friends_count - 1, 0),
                updated_at = now()
            WHERE profile_id IN (OLD.requester_id, OLD.addressee_id);
        END IF;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_friendship_count_change ON public.friendships;
CREATE TRIGGER trg_friendship_count_change
AFTER INSERT OR UPDATE OR DELETE ON public.friendships
FOR EACH ROW EXECUTE FUNCTION public.handle_friendship_count_change();

-- =============================================================================
-- 3. Trigger: Automated Social Relationship Notifications
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_friendship_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Case A: Friend Request Sent (INSERT with status 'pending')
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        -- Check if recipient has blocked requester
        IF NOT EXISTS (
            SELECT 1 FROM public.blocks
            WHERE (blocker_id = NEW.addressee_id AND blocked_id = NEW.requester_id)
        ) THEN
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
                    'status', 'pending'
                ),
                now()
            );
        END IF;
        RETURN NEW;

    -- Case B: Friend Request Accepted (UPDATE from 'pending' to 'accepted')
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
        -- Notify the original requester that addressee accepted
        IF NOT EXISTS (
            SELECT 1 FROM public.blocks
            WHERE (blocker_id = NEW.requester_id AND blocked_id = NEW.addressee_id)
        ) THEN
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
                    'status', 'accepted'
                ),
                now()
            );
        END IF;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_friendship_notification ON public.friendships;
CREATE TRIGGER trg_friendship_notification
AFTER INSERT OR UPDATE ON public.friendships
FOR EACH ROW EXECUTE FUNCTION public.handle_friendship_notification();

-- -----------------------------------------------------------------------------
-- Follow Notification Trigger on public.follows
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_follow_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    prefs_allowed BOOLEAN := true;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Avoid self-notification
        IF NEW.follower_id = NEW.following_id THEN
            RETURN NEW;
        END IF;

        -- Check if recipient has blocked follower
        IF NOT EXISTS (
            SELECT 1 FROM public.blocks
            WHERE (blocker_id = NEW.following_id AND blocked_id = NEW.follower_id)
        ) THEN
            -- Check recipient notification preferences if configured
            SELECT COALESCE(follows_enabled, true) INTO prefs_allowed
            FROM public.notification_preferences
            WHERE profile_id = NEW.following_id;

            IF prefs_allowed IS NOT FALSE THEN
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
                    NEW.following_id,
                    'follow',
                    NEW.follower_id,
                    'profile',
                    NEW.follower_id,
                    jsonb_build_object(
                        'follower_id', NEW.follower_id
                    ),
                    now()
                );
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_follow_notification ON public.follows;
CREATE TRIGGER trg_follow_notification
AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.handle_follow_notification();

-- =============================================================================
-- 4. Fast Mutual Friends Function (Returning Profile IDs & Count)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_mutual_friends(user_a UUID, user_b UUID, max_limit INT DEFAULT 10)
RETURNS TABLE (
    friend_id UUID,
    mutual_total INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    WITH friends_a AS (
        SELECT CASE WHEN requester_id = user_a THEN addressee_id ELSE requester_id END AS fid
        FROM public.friendships
        WHERE (requester_id = user_a OR addressee_id = user_a)
          AND status = 'accepted'
    ),
    friends_b AS (
        SELECT CASE WHEN requester_id = user_b THEN addressee_id ELSE requester_id END AS fid
        FROM public.friendships
        WHERE (requester_id = user_b OR addressee_id = user_b)
          AND status = 'accepted'
    ),
    mutuals AS (
        SELECT fa.fid
        FROM friends_a fa
        INNER JOIN friends_b fb ON fa.fid = fb.fid
    ),
    total AS (
        SELECT COUNT(*)::INT AS cnt FROM mutuals
    )
    SELECT m.fid AS friend_id, t.cnt AS mutual_total
    FROM mutuals m
    CROSS JOIN total t
    LIMIT max_limit;
$$;

COMMIT;

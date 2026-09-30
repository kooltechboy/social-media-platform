-- =============================================================================
-- Migration 00104: Universal Discovery GIN Trigram Indexes & Foreign Key Hardening
-- =============================================================================
-- Description:
--   1. Implements pg_trgm GIN indexes across all 10 discovery search entities
--      (businesses, communities, events, products, videos, sounds, livestreams, podcasts, profiles)
--      to eliminate sequential scans on ILIKE '%term%' universal search queries.
--   2. Adds high-frequency Foreign Key and RLS filter indexes on:
--      order_items, comments, post_reactions, post_media, products, events,
--      event_attendees, tickets, business_reviews, podcasts, livestreams,
--      creator_accounts, payment_methods, payment_connections, and ledger_entries.
--   3. Guarantees idempotent application via IF NOT EXISTS and graceful extension fallback.
-- =============================================================================

BEGIN;

-- Ensure pg_trgm extension is active for trigram GIN indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- =============================================================================
-- SECTION 1: GIN Trigram Indexes for Universal Discovery Multi-Entity Search
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN

    -- 1. Profiles additional name matching
    CREATE INDEX IF NOT EXISTS idx_profiles_first_name_trgm
      ON public.profiles USING gin (first_name gin_trgm_ops)
      WHERE first_name IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_profiles_last_name_trgm
      ON public.profiles USING gin (last_name gin_trgm_ops)
      WHERE last_name IS NOT NULL;

    -- 2. Businesses description and category
    CREATE INDEX IF NOT EXISTS idx_businesses_description_trgm
      ON public.businesses USING gin (description gin_trgm_ops)
      WHERE description IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_businesses_category_trgm
      ON public.businesses USING gin (category gin_trgm_ops)
      WHERE category IS NOT NULL;

    -- 3. Communities description
    CREATE INDEX IF NOT EXISTS idx_communities_description_trgm
      ON public.communities USING gin (description gin_trgm_ops)
      WHERE description IS NOT NULL;

    -- 4. Events description
    CREATE INDEX IF NOT EXISTS idx_events_description_trgm
      ON public.events USING gin (description gin_trgm_ops)
      WHERE description IS NOT NULL;

    -- 5. Products description
    CREATE INDEX IF NOT EXISTS idx_products_description_trgm
      ON public.products USING gin (description gin_trgm_ops)
      WHERE description IS NOT NULL;

    -- 6. Videos (Reels & Longform) title and description
    CREATE INDEX IF NOT EXISTS idx_videos_title_trgm
      ON public.videos USING gin (title gin_trgm_ops)
      WHERE title IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_videos_description_trgm
      ON public.videos USING gin (description gin_trgm_ops)
      WHERE description IS NOT NULL;

    -- 7. Sounds title, artist, and genre
    CREATE INDEX IF NOT EXISTS idx_sounds_title_trgm
      ON public.sounds USING gin (title gin_trgm_ops)
      WHERE title IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_sounds_artist_trgm
      ON public.sounds USING gin (artist gin_trgm_ops)
      WHERE artist IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_sounds_genre_trgm
      ON public.sounds USING gin (genre gin_trgm_ops)
      WHERE genre IS NOT NULL;

    -- 8. Livestreams title and category
    CREATE INDEX IF NOT EXISTS idx_livestreams_title_trgm
      ON public.livestreams USING gin (title gin_trgm_ops)
      WHERE title IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_livestreams_category_trgm
      ON public.livestreams USING gin (category gin_trgm_ops)
      WHERE category IS NOT NULL;

    -- 9. Podcasts title and description
    CREATE INDEX IF NOT EXISTS idx_podcasts_title_trgm
      ON public.podcasts USING gin (title gin_trgm_ops)
      WHERE title IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_podcasts_description_trgm
      ON public.podcasts USING gin (description gin_trgm_ops)
      WHERE description IS NOT NULL;

  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Gracefully proceed if GIN trgm ops are restricted in the current environment
END $$;

-- =============================================================================
-- SECTION 2: Foreign Key & RLS Performance Indexes
-- =============================================================================

-- Marketplace & Orders
CREATE INDEX IF NOT EXISTS idx_order_items_product_id
  ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_products_seller_id
  ON public.products(seller_id);

-- Social Graph & Interactions
CREATE INDEX IF NOT EXISTS idx_comments_author_id
  ON public.comments(author_id);

CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id
  ON public.post_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_post_media_post_id
  ON public.post_media(post_id);

-- Events & Attendance
CREATE INDEX IF NOT EXISTS idx_events_host_id
  ON public.events(host_id);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id
  ON public.event_attendees(event_id);

CREATE INDEX IF NOT EXISTS idx_tickets_event_id
  ON public.tickets(event_id);

CREATE INDEX IF NOT EXISTS idx_tickets_holder_id
  ON public.tickets(holder_id);

-- Business Reviews
CREATE INDEX IF NOT EXISTS idx_business_reviews_author_id
  ON public.business_reviews(author_id);

-- Podcasts & Streams
CREATE INDEX IF NOT EXISTS idx_podcasts_creator_id
  ON public.podcasts(creator_id);

CREATE INDEX IF NOT EXISTS idx_livestreams_creator_id
  ON public.livestreams(creator_id);

-- Creator Economy
CREATE INDEX IF NOT EXISTS idx_creator_accounts_profile_id
  ON public.creator_accounts(profile_id);

-- Payments & Ledger
CREATE INDEX IF NOT EXISTS idx_payment_methods_owner_id
  ON public.payment_methods(owner_id);

CREATE INDEX IF NOT EXISTS idx_payment_connections_user_id
  ON public.payment_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_id
  ON public.ledger_entries(account_id);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction_id
  ON public.ledger_entries(transaction_id);

COMMIT;

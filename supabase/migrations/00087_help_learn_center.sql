-- =============================================================================
-- Migration 00087: Help & Learn Center Schema
-- =============================================================================
-- Description:
--   Creates the full schema for the TUKUBI Help + Learn Center, including:
--   1. help_categories      — Taxonomy for organising articles and FAQs
--   2. help_articles        — Markdown knowledge base articles with full-text search
--   3. help_faqs            — Frequently-asked questions linked to categories/articles
--   4. help_article_feedback — Anonymous/authenticated thumbs feedback on articles
--   5. help_search_queries  — Analytics log of search terms and result counts
--   6. help_tutorial_steps  — Ordered in-app walkthrough step definitions
--   7. SECURITY DEFINER helper: increment_help_article_views()
--   8. Auto-update trigger for help_articles.updated_at
--   9. Row Level Security on every table
--  10. Seed data: 17 initial help categories
-- =============================================================================
--
-- Rollback Plan:
--   DROP TRIGGER  IF EXISTS trg_help_article_updated_at    ON public.help_articles;
--   DROP FUNCTION IF EXISTS public.handle_help_article_updated_at();
--   DROP FUNCTION IF EXISTS public.increment_help_article_views(uuid);
--   DROP TABLE IF EXISTS public.help_tutorial_steps;
--   DROP TABLE IF EXISTS public.help_search_queries;
--   DROP TABLE IF EXISTS public.help_article_feedback;
--   DROP TABLE IF EXISTS public.help_faqs;
--   DROP TABLE IF EXISTS public.help_articles;
--   DROP TABLE IF EXISTS public.help_categories;
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. help_categories
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.help_categories (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        text        NOT NULL UNIQUE,
  title       text        NOT NULL,
  description text,
  icon        text,        -- lucide icon name e.g. 'Compass', 'MessageSquare'
  color       text,        -- CSS color e.g. '#38BDF8'
  sort_order  int         NOT NULL DEFAULT 0,
  is_public   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can read public categories
CREATE POLICY "Public read help_categories"
  ON public.help_categories
  FOR SELECT
  USING (is_public = true);

-- Admins can read ALL categories (including non-public)
CREATE POLICY "Admins read all help_categories"
  ON public.help_categories
  FOR SELECT
  USING (public.is_admin());

-- Admins can insert categories
CREATE POLICY "Admins insert help_categories"
  ON public.help_categories
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update categories
CREATE POLICY "Admins update help_categories"
  ON public.help_categories
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete categories
CREATE POLICY "Admins delete help_categories"
  ON public.help_categories
  FOR DELETE
  USING (public.is_admin());

-- =============================================================================
-- 2. help_articles
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.help_articles (
  id                uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug              text        NOT NULL UNIQUE,
  title             text        NOT NULL,
  description       text,
  content           text        NOT NULL DEFAULT '',  -- markdown content
  category_id       uuid        REFERENCES public.help_categories(id) ON DELETE SET NULL,
  feature_slug      text,        -- e.g. 'explore', 'reels', 'messaging'
  status            text        NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'review', 'published', 'archived')),
  is_public         boolean     NOT NULL DEFAULT false,
  views_count       bigint      NOT NULL DEFAULT 0,
  helpful_count     bigint      NOT NULL DEFAULT 0,
  not_helpful_count bigint      NOT NULL DEFAULT 0,
  tutorial_id       text,        -- for future walkthrough linkage
  seo_title         text,
  seo_description   text,
  search_tokens     tsvector    GENERATED ALWAYS AS (
                      setweight(to_tsvector('english', coalesce(title,       '')), 'A') ||
                      setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
                      setweight(to_tsvector('english', coalesce(content,     '')), 'C')
                    ) STORED,
  created_by        uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at      timestamptz,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS help_articles_search_idx
  ON public.help_articles USING GIN (search_tokens);

-- Category lookup
CREATE INDEX IF NOT EXISTS help_articles_category_idx
  ON public.help_articles (category_id);

-- Status index (partial: only publicly visible rows)
CREATE INDEX IF NOT EXISTS help_articles_status_idx
  ON public.help_articles (status)
  WHERE is_public = true;

-- Feature-slug lookup for contextual help panels
CREATE INDEX IF NOT EXISTS help_articles_feature_idx
  ON public.help_articles (feature_slug);

ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

-- Public (anon + authenticated) can read published & public articles
CREATE POLICY "Public read published help_articles"
  ON public.help_articles
  FOR SELECT
  USING (status = 'published' AND is_public = true);

-- Admins can read articles in any status
CREATE POLICY "Admins read all help_articles"
  ON public.help_articles
  FOR SELECT
  USING (public.is_admin());

-- Admins can insert articles
CREATE POLICY "Admins insert help_articles"
  ON public.help_articles
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update articles
CREATE POLICY "Admins update help_articles"
  ON public.help_articles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete articles
CREATE POLICY "Admins delete help_articles"
  ON public.help_articles
  FOR DELETE
  USING (public.is_admin());

-- =============================================================================
-- 2a. SECURITY DEFINER function: increment_help_article_views
--     The ONLY permitted mutable counter increment in this schema.
--     Non-financial analytics counter — isolated via SECURITY DEFINER so that
--     the underlying row is never directly writable by clients.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.increment_help_article_views(article_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.help_articles
  SET views_count = views_count + 1
  WHERE id = article_uuid;
END;
$$;

-- Revoke direct execute from public, then grant to anon + authenticated
REVOKE ALL ON FUNCTION public.increment_help_article_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_help_article_views(uuid) TO anon, authenticated;

-- =============================================================================
-- 2b. Auto-update trigger for help_articles.updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_help_article_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_help_article_updated_at ON public.help_articles;
CREATE TRIGGER trg_help_article_updated_at
  BEFORE UPDATE ON public.help_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_help_article_updated_at();

-- =============================================================================
-- 3. help_faqs
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.help_faqs (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question    text        NOT NULL,
  answer      text        NOT NULL,
  category_id uuid        REFERENCES public.help_categories(id) ON DELETE SET NULL,
  article_id  uuid        REFERENCES public.help_articles(id)   ON DELETE CASCADE,
  sort_order  int         NOT NULL DEFAULT 0,
  is_public   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.help_faqs ENABLE ROW LEVEL SECURITY;

-- Public can read public FAQs
CREATE POLICY "Public read help_faqs"
  ON public.help_faqs
  FOR SELECT
  USING (is_public = true);

-- Admins can read all FAQs
CREATE POLICY "Admins read all help_faqs"
  ON public.help_faqs
  FOR SELECT
  USING (public.is_admin());

-- Admins can insert FAQs
CREATE POLICY "Admins insert help_faqs"
  ON public.help_faqs
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update FAQs
CREATE POLICY "Admins update help_faqs"
  ON public.help_faqs
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete FAQs
CREATE POLICY "Admins delete help_faqs"
  ON public.help_faqs
  FOR DELETE
  USING (public.is_admin());

-- =============================================================================
-- 4. help_article_feedback
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.help_article_feedback (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id    uuid        NOT NULL REFERENCES public.help_articles(id) ON DELETE CASCADE,
  session_id    text,        -- anonymous session tracking (no PII)
  is_helpful    boolean     NOT NULL,
  feedback_text text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.help_article_feedback ENABLE ROW LEVEL SECURITY;

-- Anon + authenticated can submit feedback
CREATE POLICY "Anyone can submit article feedback"
  ON public.help_article_feedback
  FOR INSERT
  WITH CHECK (true);

-- Admins can read all feedback
CREATE POLICY "Admins read help_article_feedback"
  ON public.help_article_feedback
  FOR SELECT
  USING (public.is_admin());

-- No UPDATE or DELETE policies for non-admin (feedback is immutable after submission)

-- =============================================================================
-- 5. help_search_queries
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.help_search_queries (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query         text        NOT NULL,
  results_count int         NOT NULL DEFAULT 0,
  session_id    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.help_search_queries ENABLE ROW LEVEL SECURITY;

-- Anon + authenticated can log search queries
CREATE POLICY "Anyone can log search queries"
  ON public.help_search_queries
  FOR INSERT
  WITH CHECK (true);

-- Admins can read search analytics
CREATE POLICY "Admins read help_search_queries"
  ON public.help_search_queries
  FOR SELECT
  USING (public.is_admin());

-- No UPDATE or DELETE policies for non-admin

-- =============================================================================
-- 6. help_tutorial_steps
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.help_tutorial_steps (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutorial_id     text        NOT NULL,
  step_order      int         NOT NULL,
  title           text        NOT NULL,
  content         text        NOT NULL,
  target_selector text,        -- CSS selector for element to highlight
  target_route    text,        -- route to navigate to e.g. '/explore'
  media_url       text,
  cta_label       text,
  cta_href        text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tutorial_id, step_order)
);

ALTER TABLE public.help_tutorial_steps ENABLE ROW LEVEL SECURITY;

-- Public (anon + authenticated) can read tutorial steps
CREATE POLICY "Public read help_tutorial_steps"
  ON public.help_tutorial_steps
  FOR SELECT
  USING (true);

-- Admins can insert tutorial steps
CREATE POLICY "Admins insert help_tutorial_steps"
  ON public.help_tutorial_steps
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update tutorial steps
CREATE POLICY "Admins update help_tutorial_steps"
  ON public.help_tutorial_steps
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete tutorial steps
CREATE POLICY "Admins delete help_tutorial_steps"
  ON public.help_tutorial_steps
  FOR DELETE
  USING (public.is_admin());

-- =============================================================================
-- 7. Seed Data: 17 Initial Help Categories
-- =============================================================================

INSERT INTO public.help_categories (slug, title, description, icon, color, sort_order, is_public) VALUES
  ('getting-started',  'Getting Started',    'Everything you need to begin your TUKUBI journey.',                        'Sparkles',      '#FF7A59', 1,  true),
  ('explore',          'Explore TUKUBI',     'Discover Caribbean culture, countries, vibes, and diaspora communities.',  'Compass',       '#38BDF8', 2,  true),
  ('create',           'Create & Publish',   'Post photos, videos, stories, and more.',                                  'PlusCircle',    '#FF7A59', 3,  true),
  ('reels-video',      'Reels & Video',      'Create, share, and discover short-form Caribbean video.',                  'Video',         '#EC4899', 4,  true),
  ('live',             'Live',               'Go live and discover live streams across the Caribbean.',                   'Tv',            '#EF4444', 5,  true),
  ('podcasts',         'Podcasts',           'Listen to and create Caribbean podcast content.',                           'Mic',           '#A855F7', 6,  true),
  ('communities',      'Communities',        'Find, join and participate in diaspora communities.',                       'Users',         '#22D3EE', 7,  true),
  ('messaging',        'Messaging',          'Connect and communicate with members on TUKUBI.',                           'MessageSquare', '#94A3B8', 8,  true),
  ('creators',         'Creators',           'Creator Hub, Creator Studio, monetization and analytics.',                  'Radio',         '#F59E0B', 9,  true),
  ('marketplace',      'Marketplace',        'Buy and sell Caribbean goods and services.',                                'ShoppingBag',   '#F97316', 10, true),
  ('events',           'Events',             'Discover and create Caribbean cultural events.',                            'Calendar',      '#EAB308', 11, true),
  ('pages-stores',     'Pages & Stores',     'Create and manage business pages and storefronts.',                         'Building2',     '#FF7A59', 12, true),
  ('financial-center', 'Financial Center',   'Manage your accounts, transactions, and payouts.',                          'Wallet',        '#22C55E', 13, true),
  ('profile-settings', 'Profile & Settings', 'Manage your profile, privacy, notifications and preferences.',              'Settings',      '#94A3B8', 14, true),
  ('privacy-security', 'Privacy & Security', 'Keep your account safe and control who sees your content.',                 'Shield',        '#3B82F6', 15, true),
  ('troubleshooting',  'Troubleshooting',    'Fix common issues and get help when something goes wrong.',                 'AlertTriangle', '#EF4444', 16, true),
  ('whats-new',        'What''s New',        'The latest TUKUBI features, improvements and updates.',                    'Zap',           '#38BDF8', 17, true)
ON CONFLICT (slug) DO NOTHING;

COMMIT;

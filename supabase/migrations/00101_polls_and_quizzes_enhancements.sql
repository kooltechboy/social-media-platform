-- Migration 00101: Native Polls & Quizzes Enhancements
-- Adds quiz mode support (explanation, correct option), option image attachments,
-- server-evaluated tamper-proof vote correctness, and maintains strict RLS.

-- 1. Extend Polls Table for Quiz Mode
ALTER TABLE public.polls
    ADD COLUMN IF NOT EXISTS is_quiz BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS quiz_explanation TEXT,
    ADD COLUMN IF NOT EXISTS correct_option_id UUID REFERENCES public.poll_options(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.polls.is_quiz IS 'Indicates whether the poll operates as an educational quiz with a designated correct answer.';
COMMENT ON COLUMN public.polls.quiz_explanation IS 'Educational explanation revealed to users after submitting their vote in quiz mode.';
COMMENT ON COLUMN public.polls.correct_option_id IS 'UUID of the correct option for quizzes, referencing poll_options.';

CREATE INDEX IF NOT EXISTS idx_polls_correct_option_id ON public.polls(correct_option_id);

-- 2. Extend Poll Options Table for Media / Images
ALTER TABLE public.poll_options
    ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN public.poll_options.image_url IS 'Optional image URL representing the option in rich visual polls or quizzes.';

-- 3. Extend Poll Votes Table for Correctness Tracking
ALTER TABLE public.poll_votes
    ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;

COMMENT ON COLUMN public.poll_votes.is_correct IS 'Server-computed correctness boolean populated atomically upon vote insertion.';

CREATE INDEX IF NOT EXISTS idx_poll_votes_correctness ON public.poll_votes(poll_id, is_correct);

-- 4. Server-Authoritative & Tamper-Proof Trigger Function
CREATE OR REPLACE FUNCTION public.handle_poll_vote_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_poll RECORD;
BEGIN
    -- Query poll state for validation and scoring
    SELECT id, expires_at, is_quiz, correct_option_id
    INTO v_poll
    FROM public.polls
    WHERE id = NEW.poll_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Poll not found.';
    END IF;

    -- 1. Enforce poll non-expiration (expires_at > now())
    IF v_poll.expires_at <= now() THEN
        RAISE EXCEPTION 'This poll has ended and is no longer accepting votes.';
    END IF;

    -- 2. Server-side evaluation of correctness for quiz mode (tamper-proof)
    IF v_poll.is_quiz THEN
        NEW.is_correct := (NEW.option_id = v_poll.correct_option_id);
    ELSE
        NEW.is_correct := NULL;
    END IF;

    -- 3. Atomically increment option votes_count
    UPDATE public.poll_options
    SET votes_count = votes_count + 1
    WHERE id = NEW.option_id AND poll_id = NEW.poll_id;

    -- 4. Atomically increment overall poll total_votes
    UPDATE public.polls
    SET total_votes = total_votes + 1
    WHERE id = NEW.poll_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop previous trigger (previously AFTER INSERT) and recreate as BEFORE INSERT
DROP TRIGGER IF EXISTS trg_poll_vote_insert ON public.poll_votes;
CREATE TRIGGER trg_poll_vote_insert
BEFORE INSERT ON public.poll_votes
FOR EACH ROW
EXECUTE FUNCTION public.handle_poll_vote_insert();

-- 5. Row Level Security Verification & Maintenance
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.polls FORCE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options FORCE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes FORCE ROW LEVEL SECURITY;

-- 6. Expand post_reactions CHECK constraint to include 'palm' and 'sound'
DO $$
DECLARE
  v_conname text;
BEGIN
  SELECT conname INTO v_conname
  FROM pg_constraint
  WHERE conrelid = 'public.post_reactions'::regclass
    AND contype = 'c'
    AND conname LIKE '%reaction_type%'
  LIMIT 1;
  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.post_reactions DROP CONSTRAINT %I', v_conname);
  END IF;
END;
$$;

ALTER TABLE public.post_reactions
  ADD CONSTRAINT post_reactions_reaction_type_check
  CHECK (reaction_type IN ('like','love','fire','celebrate','laugh','wow','sad','angry','palm','sound'));

COMMENT ON COLUMN public.post_reactions.reaction_type IS
  'Caribbean reaction types: like | love | fire | celebrate | laugh | wow | sad | angry | palm | sound';

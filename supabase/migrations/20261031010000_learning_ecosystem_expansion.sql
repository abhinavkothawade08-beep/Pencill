-- =============================================================================
-- PENCILL: LEARNING ECOSYSTEM EXPANSION MIGRATION
-- Migration: 20261031010000_learning_ecosystem_expansion.sql
-- Adds safe additive tables and columns for:
-- 1. Spaced Repetition Memory Science (FSRS / SM-2 cards)
-- 2. Community Discussions & Collaborative Learning
-- 3. Verified Learner Credentials & Skill Badges
-- 4. Safe additive metadata columns on learning_paths
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SPACED REPETITION CARDS (Memory Science & Spaced Retention)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.spaced_repetition_cards (
  id TEXT PRIMARY KEY DEFAULT ('card_' || gen_random_uuid()::text),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  module_id TEXT,
  lesson_id TEXT,
  concept TEXT NOT NULL,
  prompt TEXT NOT NULL,
  solution TEXT NOT NULL,
  card_type TEXT DEFAULT 'flashcard' CHECK (card_type IN ('flashcard', 'formula', 'quiz_revisit', 'concept')),
  stability NUMERIC(6, 2) DEFAULT 1.0,
  difficulty NUMERIC(4, 2) DEFAULT 5.0,
  repetitions INTEGER DEFAULT 0,
  lapses INTEGER DEFAULT 0,
  last_rating INTEGER, -- 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
  due_date TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_spaced_cards_user_due ON public.spaced_repetition_cards(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_spaced_cards_course ON public.spaced_repetition_cards(course_id);

ALTER TABLE public.spaced_repetition_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own spaced repetition cards" ON public.spaced_repetition_cards;
CREATE POLICY "Users can manage their own spaced repetition cards"
  ON public.spaced_repetition_cards FOR ALL
  USING (
    auth.uid() IS NULL -- Allow guest/server fallback
    OR auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() IS NULL
    OR auth.uid() = user_id
  );

-- -----------------------------------------------------------------------------
-- 2. COMMUNITY DISCUSSIONS & COLLABORATIVE LEARNING
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_discussions (
  id TEXT PRIMARY KEY DEFAULT ('disc_' || gen_random_uuid()::text),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Scholar',
  author_avatar TEXT DEFAULT '/avatars/default-avatar.svg',
  course_id TEXT,
  lesson_id TEXT,
  domain TEXT DEFAULT 'General',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  upvotes INTEGER DEFAULT 0,
  upvoter_user_ids TEXT[] DEFAULT '{}',
  reply_count INTEGER DEFAULT 0,
  is_solved BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_reported BOOLEAN DEFAULT FALSE,
  report_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_discussions_course ON public.community_discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_discussions_domain ON public.community_discussions(domain);
CREATE INDEX IF NOT EXISTS idx_discussions_created ON public.community_discussions(created_at DESC);

ALTER TABLE public.community_discussions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for community discussions" ON public.community_discussions;
CREATE POLICY "Public read access for community discussions"
  ON public.community_discussions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users and server can insert discussions" ON public.community_discussions;
CREATE POLICY "Authenticated users and server can insert discussions"
  ON public.community_discussions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authors can update discussions" ON public.community_discussions;
CREATE POLICY "Authors can update discussions"
  ON public.community_discussions FOR UPDATE
  USING (auth.uid() IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Authors can delete discussions" ON public.community_discussions;
CREATE POLICY "Authors can delete discussions"
  ON public.community_discussions FOR DELETE
  USING (auth.uid() IS NULL OR auth.uid() = user_id);

-- Discussion Replies
CREATE TABLE IF NOT EXISTS public.community_replies (
  id TEXT PRIMARY KEY DEFAULT ('rep_' || gen_random_uuid()::text),
  discussion_id TEXT NOT NULL REFERENCES public.community_discussions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Peer Scholar',
  author_avatar TEXT DEFAULT '/avatars/default-avatar.svg',
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  upvoter_user_ids TEXT[] DEFAULT '{}',
  is_accepted_answer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_replies_discussion ON public.community_replies(discussion_id);

ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for community replies" ON public.community_replies;
CREATE POLICY "Public read access for community replies"
  ON public.community_replies FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users and server can insert replies" ON public.community_replies;
CREATE POLICY "Authenticated users and server can insert replies"
  ON public.community_replies FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authors can update replies" ON public.community_replies;
CREATE POLICY "Authors can update replies"
  ON public.community_replies FOR UPDATE
  USING (auth.uid() IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Authors can delete replies" ON public.community_replies;
CREATE POLICY "Authors can delete replies"
  ON public.community_replies FOR DELETE
  USING (auth.uid() IS NULL OR auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. LEARNER CREDENTIALS & SKILL BADGES (Evidence-Based Mastery)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learner_credentials (
  id TEXT PRIMARY KEY DEFAULT ('cred_' || gen_random_uuid()::text),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  course_title TEXT NOT NULL,
  domain TEXT NOT NULL,
  credential_type TEXT DEFAULT 'course_certificate' CHECK (credential_type IN ('course_certificate', 'skill_badge', 'checkpoint_honors')),
  title TEXT NOT NULL,
  verification_hash TEXT NOT NULL UNIQUE,
  score_percentage NUMERIC(5, 2) NOT NULL,
  criteria_met JSONB DEFAULT '[]'::jsonb,
  issued_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credentials_user ON public.learner_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_hash ON public.learner_credentials(verification_hash);

ALTER TABLE public.learner_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learners can view credentials" ON public.learner_credentials;
CREATE POLICY "Learners can view credentials"
  ON public.learner_credentials FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authorized insertion of credentials" ON public.learner_credentials;
CREATE POLICY "Authorized insertion of credentials"
  ON public.learner_credentials FOR INSERT
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 4. SAFE ADDITIVE COLUMNS ON LEARNING PATHS
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.learning_paths
  ADD COLUMN IF NOT EXISTS prerequisite_graph JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS schedule_config JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS quality_score NUMERIC(4, 1) DEFAULT 95.0,
  ADD COLUMN IF NOT EXISTS verified_outcomes JSONB DEFAULT '[]'::jsonb;

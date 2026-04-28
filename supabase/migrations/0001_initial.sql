-- ============================================================================
-- 0001_initial.sql
-- youinc / trade-yourself V0 schema
--
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New
-- query -> paste this -> Run). Idempotent? No — running twice will error on
-- the duplicate types. Safe to drop and re-run during dev.
-- ============================================================================

-- 1) users: extends Supabase auth.users with app-level fields
CREATE TABLE public.users (
    id                          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email                       TEXT NOT NULL,
    display_name                TEXT NOT NULL,
    ticker_symbol               TEXT,
    ipo_date                    DATE,
    baseline_price              NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    baseline_assessment_text    TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) rubric_versions: append-only history of scoring rubrics
CREATE TABLE public.rubric_versions (
    version                     INTEGER PRIMARY KEY,
    rubric_text                 TEXT NOT NULL,
    anchor_examples_json        JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) entries: the actual logged events
CREATE TABLE public.entries (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    text                        TEXT NOT NULL CHECK (length(text) BETWEEN 1 AND 2000),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    score                       NUMERIC(4, 2) NOT NULL CHECK (score BETWEEN -10 AND 10),
    magnitude                   TEXT NOT NULL CHECK (magnitude IN ('small', 'medium', 'large')),
    category                    TEXT,
    llm_reasoning               TEXT NOT NULL,
    rubric_version              INTEGER NOT NULL REFERENCES public.rubric_versions(version)
);

CREATE INDEX idx_entries_user_created
    ON public.entries(user_id, created_at DESC);

CREATE INDEX idx_entries_user_rubric
    ON public.entries(user_id, rubric_version);

-- 4) earnings_letters: cached quarterly letters
CREATE TABLE public.earnings_letters (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    year                        INTEGER NOT NULL,
    quarter                     INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    text                        TEXT NOT NULL,
    percent_change              NUMERIC(8, 2),
    events_used                 INTEGER NOT NULL,
    generated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, year, quarter)
);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------

ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_versions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings_letters   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_self_all" ON public.users
    FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "entries_self_all" ON public.entries
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "earnings_self_all" ON public.earnings_letters
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Rubrics readable by everyone, writable only via service-role (seed script).
CREATE POLICY "rubric_read_all" ON public.rubric_versions
    FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- Trigger: create public.users row on auth signup
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- display_name defaults to the email's local-part (everything before @).
    -- Guarantees the earnings-letter prompt never sees null.
    -- Users can edit it during onboarding or later.
    INSERT INTO public.users (id, email, display_name)
    VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

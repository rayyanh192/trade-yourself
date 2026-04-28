# PLAN.md — trade-yourself implementation plan

Generated 2026-04-27. Source of truth for the WHAT is `~/.gstack/projects/rayyanh192-trade-yourself/rayyan-main-design-20260427-134406.md`. This file is the HOW.

Read this top to bottom once before writing any code. Then build from Section 8 (Build Order). Sections 1–7 are reference for that build.

**Stack:** Next.js 15 App Router · TypeScript · Tailwind · Tremor (charts) · Vercel AI SDK with Anthropic Claude · Supabase (auth + Postgres) · Bun (runtime + package manager) · Vercel (hosting).

---

## 0. Design system (V0)

This section was added by `/plan-design-review`. It's the visual contract every screen must follow. If something here disagrees with the rest of the plan, this section wins for visual decisions.

**Palette (CSS variables in `app/globals.css`):**

```css
:root {
  /* Surfaces */
  --bg:           #0a0a0a;       /* near-black page background (dark mode default) */
  --surface:      #141414;       /* cards, modals, slightly raised */
  --surface-2:    #1d1d1d;       /* hovered / focused states */
  --border:       #2a2a2a;       /* hairline dividers */

  /* Text */
  --text:         #ededed;       /* body */
  --text-muted:   #8a8a8a;       /* secondary, captions, placeholders */
  --text-subtle:  #5a5a5a;       /* axis labels, baseline references */

  /* Semantic / chart */
  --up:           #4ade80;       /* emerald — chart up, positive % change */
  --down:         #f87171;       /* rose — chart down, negative % change */
  --accent:       #ededed;       /* the same near-white as text. minimal, monochrome aesthetic. */
  --baseline:     #3a3a3a;       /* the $100 reference line */

  /* Focus */
  --focus-ring:   #4a4a4a;       /* keyboard focus outline */
}
```

V0 ships dark mode only. Light mode is V0.5 (just invert and adjust the chart colors).

**Typography:**

Two typefaces, both via `next/font`:
- **Headings + ticker numbers:** [Söhne Mono](https://klim.co.nz/retail-fonts/soehne-mono/) if budget allows, or **JetBrains Mono** (free) as fallback. Used for: `$RAYH` ticker, `$127.43` price, `+27.43%`, chart axis numbers.
- **Body + UI:** **Inter Display** is too generic — use **Söhne** (paid) or **General Sans** (free) instead. Used for: editorial headings, body, button labels, textarea.

Hard NO: Inter (default body), system-ui as primary display, Roboto, Arial.

**Type scale (Tailwind `theme.fontSize` extension):**

```
display-xl:   48px / 56px line-height / -0.02em tracking   (onboarding heading)
display-lg:   36px / 44px / -0.01em                        (current price on dashboard)
display-md:   24px / 32px / -0.005em                       (modal heading, section headers)
body-lg:      18px / 28px                                  (subtitles, intro paragraphs)
body:         16px / 24px                                  (default — DO NOT GO BELOW)
caption:      14px / 20px                                  (axis labels, timestamps)
mono-sm:      13px / 20px                                  (entry timestamps in modal)
```

**Spacing scale (8-point grid):** 4, 8, 12, 16, 24, 32, 48, 64, 96 px. Never use arbitrary values like 13px or 27px.

**Corner radius:** 4px on inputs, 6px on buttons, 8px on modals. Nothing more rounded than 8px (avoids the "bubbly AI card" pattern).

**Shadows:** none in V0. Hierarchy is from background contrast (`--bg` → `--surface` → `--surface-2`), not blur. Saves you from the "decorative drop shadows" AI slop pattern.

**Motion (V0 minimum):**
- New chart point: 240ms ease-out fade-in + scale from 0.8 → 1.0
- Modal open: 180ms ease-out fade + 4px translate-up
- Submit button on click: 80ms scale to 0.96, then back. No bouncy springs.
- That's it. Don't add hover wiggles, no scroll-linked parallax, no decorative blobs.

**Accessibility minimums:**
- Body text is 16px minimum. The 13px `mono-sm` is reserved for non-essential metadata (timestamps).
- Color contrast: every text-on-background pair tested at 4.5:1 minimum (axis labels at 3.0:1 are fine since they're decorative). Use https://webaim.org/resources/contrastchecker before shipping.
- Focus state: every interactive element has a visible 2px `--focus-ring` outline on `:focus-visible`. Tailwind: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`.
- Touch targets: 44px minimum hit area on mobile. Buttons that look smaller need invisible padding.
- Keyboard: Enter submits the entry textbox. Cmd+Enter (Mac) / Ctrl+Enter (PC) also submits (power user).
- Visited links: must visually differ from unvisited (color shift). Default browser behavior is fine; don't override.

---

## 1. File tree

```
trade-yourself/
├── app/                                 Next.js App Router pages
│   ├── layout.tsx                       Root layout, fonts, providers
│   ├── page.tsx                         Landing — redirects based on auth + onboarding
│   ├── globals.css                      Tailwind + Tremor base styles
│   ├── login/
│   │   └── page.tsx                     Email + "send magic link"
│   ├── auth/
│   │   └── callback/route.ts            Supabase auth callback (PKCE / OAuth handshake)
│   ├── onboarding/
│   │   └── page.tsx                     IPO date + 3-sentence baseline form
│   └── dashboard/
│       ├── page.tsx                     Main: header, chart, textbox, earnings button
│       └── entry/[id]/page.tsx          Permalinked entry view (also renderable as modal)
│
├── components/                          UI components
│   ├── Header.tsx                       Ticker symbol, current price, % vs baseline
│   ├── EntryTextbox.tsx                 The "what happened today?" input + submit
│   ├── PriceChart.tsx                   Tremor LineChart wrapper (chart of price[t])
│   ├── EntryModal.tsx                   Modal that opens when a chart point is clicked
│   ├── BaselineForm.tsx                 IPO date picker + baseline textarea
│   ├── EarningsLetterButton.tsx         Generate / view quarterly letter
│   └── ui/                              Optional shadcn/ui primitives if you add them
│
├── actions/                             "use server" server actions
│   ├── entries.ts                       createEntry, getEntries, getEntry
│   ├── user.ts                          setIPODate, getCurrentUser
│   └── earnings.ts                      generateQuarterlyLetter, getQuarterlyLetter
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    Browser Supabase client (anon key)
│   │   ├── server.ts                    Server Supabase client (anon key + user session cookie — RLS still applies; never service role)
│   │   ├── admin.ts                     One-off service-role client for the seed script ONLY (gitignored env var, never imported by app code)
│   │   └── types.ts                     `supabase gen types typescript` output
│   ├── llm/
│   │   ├── score.ts                     scoreEntry: calls Anthropic with rubric + Zod schema
│   │   ├── earnings-letter.ts           generateLetter: builds + calls earnings-letter prompt
│   │   └── prompts.ts                   The rubric text, system messages, version constants
│   ├── price.ts                         computePriceSeries (pure function)
│   └── utils.ts                         Date helpers (quarter-of, format, ISO)
│
├── supabase/
│   ├── migrations/
│   │   └── 0001_initial.sql             Tables, RLS policies, triggers
│   └── seed.ts                          Bun script: imports SCORE_SYSTEM_MESSAGE from lib/llm/prompts.ts and inserts version 1 into rubric_versions. Single source of truth for the rubric — no duplication with seed.sql.
│
├── public/                              favicon, og-image
├── .env.local                           Local secrets (gitignored)
├── .env.example                         Checked-in template
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── bun.lockb
├── README.md                            Public-facing
├── LICENSE                              MIT or AGPL — decide before first push
├── CLAUDE.md                            (already exists — gstack routing rules)
├── NEXT_STEPS.md                        (already exists — checkpoint)
└── PLAN.md                              this file
```

**Convention notes:**
- Server actions live under `actions/` rather than colocated with components, because there are few of them and explicit grouping is clearer for a beginner.
- LLM logic lives in `lib/llm/` so the prompts are findable and versionable as a unit.
- The `supabase/` directory is the source of truth for schema. Never run schema changes via the web UI — write a new `0002_*.sql` migration, run that, commit it.

---

## 2. Database schema

Postgres flavor (Supabase). Run inside `supabase/migrations/0001_initial.sql`. RLS is on for every user-data table.

```sql
-- ============================================================================
-- 0001_initial.sql
-- ============================================================================

-- 1) users: extends Supabase auth.users with app-level fields
CREATE TABLE public.users (
    id                          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email                       TEXT NOT NULL,
    display_name                TEXT NOT NULL,                           -- e.g. "rayyanh192" (defaulted from email username on signup, editable later)
    ticker_symbol               TEXT,                                    -- 1-5 chars, e.g. "RAYH" (lazy-set on first dashboard visit if NULL)
    ipo_date                    DATE,                                    -- NULL until onboarded
    baseline_price              NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    baseline_assessment_text    TEXT,                                    -- 3-sentence answer
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) rubric_versions: append-only history of scoring rubrics
CREATE TABLE public.rubric_versions (
    version                     INTEGER PRIMARY KEY,
    rubric_text                 TEXT NOT NULL,                           -- the full rubric prompt
    anchor_examples_json        JSONB NOT NULL DEFAULT '[]'::jsonb,      -- calibration examples
    notes                       TEXT,                                    -- "v1: initial release", etc
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
    category                    TEXT,                                    -- career, relationships, etc.
    llm_reasoning               TEXT NOT NULL,
    rubric_version              INTEGER NOT NULL REFERENCES public.rubric_versions(version)
);

CREATE INDEX idx_entries_user_created
    ON public.entries(user_id, created_at DESC);

CREATE INDEX idx_entries_user_rubric
    ON public.entries(user_id, rubric_version);   -- supports V0.5 "recompute under new rubric"

-- 4) earnings_letters: cached quarterly letters
CREATE TABLE public.earnings_letters (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    year                        INTEGER NOT NULL,
    quarter                     INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    text                        TEXT NOT NULL,
    percent_change              NUMERIC(8, 2),                           -- gain/loss for the quarter
    events_used                 INTEGER NOT NULL,                        -- how many entries fed the letter
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

-- Rubrics are readable by everyone, writable only via migrations (no user policy).
CREATE POLICY "rubric_read_all" ON public.rubric_versions
    FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- Trigger: create public.users row on auth signup
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- display_name defaults to the email's local-part (everything before @).
    -- This guarantees the earnings-letter prompt always has a non-null name.
    -- Users edit this in onboarding.
    INSERT INTO public.users (id, email, display_name)
    VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

And `supabase/seed.ts` (run once, post-migration via `bun run supabase/seed.ts`):

```typescript
// supabase/seed.ts — single source of truth for rubric is lib/llm/prompts.ts
import { createClient } from '@supabase/supabase-js';
import { SCORE_SYSTEM_MESSAGE, CURRENT_RUBRIC_VERSION } from '../lib/llm/prompts';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,    // service-role only here, never in app code
);

const { error } = await supabase
    .from('rubric_versions')
    .upsert({
        version: CURRENT_RUBRIC_VERSION,
        rubric_text: SCORE_SYSTEM_MESSAGE,
        anchor_examples_json: [],
        notes: `v${CURRENT_RUBRIC_VERSION}: synced from prompts.ts at ${new Date().toISOString()}`,
    });

if (error) { console.error(error); process.exit(1); }
console.log(`Seeded rubric version ${CURRENT_RUBRIC_VERSION}.`);
```

Run with: `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bun run supabase/seed.ts`. The service-role key lives in your shell env, NEVER in `.env.local` (which is shipped to the client at build time for `NEXT_PUBLIC_*` keys — and a stray service-role key there is a catastrophic leak).

**Decisions encoded in this schema:**
- `score` is `NUMERIC(4,2)` not `INTEGER` so the LLM can return decimals if it wants (e.g., +3.5). The CHECK clamps it to [-10, 10].
- `text` capped at 2000 chars at the DB level. The UI enforces it earlier.
- `earnings_letters` has a UNIQUE constraint on `(user_id, year, quarter)` so generation is idempotent — a "regenerate" button would need to DELETE first or be V1+.
- `ticker_symbol` is on `users` so you can show "RAYH up 12%" in the header. V0 default: first 4 chars of email or display_name, uppercased. User can edit later.
- `display_name` exists for the earnings letter ("CEO of {display_name} Inc.").

---

## 3. Server actions

All in `actions/`. All marked `"use server"` at the top of each file.

```typescript
// actions/entries.ts
import { z } from 'zod';

export type Entry = {
    id: string;
    user_id: string;
    text: string;
    created_at: string;       // ISO 8601
    score: number;
    magnitude: 'small' | 'medium' | 'large';
    category: string | null;
    llm_reasoning: string;
    rubric_version: number;
};

export async function createEntry(text: string): Promise<Entry>;
//   1. Validate input (1..2000 chars, not just whitespace).
//   2. Read current user from server-side Supabase client.
//   3. If user.ipo_date IS NULL → throw OnboardingRequiredError.
//   4. Call scoreEntry(text, { baseline_assessment_text }) from lib/llm/score.
//   5. Compute magnitude from |score| via magnitudeFromScore() helper.
//   6. INSERT into entries with rubric_version from scoreEntry result and computed magnitude.
//   7. revalidatePath('/dashboard').
//   8. Return the inserted Entry.
// IMPORTANT: errors from steps 4 or 6 must propagate to the caller WITHOUT mutating
// the textbox state. The client component (EntryTextbox) is responsible for keeping
// `text` in its local state across the await — do NOT use `useOptimistic` to clear
// the input on submit; clear it only after the server action resolves successfully.

export async function getEntries(): Promise<Entry[]>;
//   1. Read current user.
//   2. SELECT * FROM entries WHERE user_id = $1 ORDER BY created_at ASC.
//   3. Return.

export async function getEntry(id: string): Promise<Entry | null>;
//   1. Read current user.
//   2. SELECT * FROM entries WHERE id = $1 AND user_id = $2 LIMIT 1.
//   3. Return null if not found (RLS will already filter cross-user reads).
```

```typescript
// actions/user.ts
export type UserProfile = {
    id: string;
    email: string;
    display_name: string | null;
    ticker_symbol: string | null;
    ipo_date: string | null;            // YYYY-MM-DD
    baseline_price: number;
    baseline_assessment_text: string | null;
};

export async function getCurrentUser(): Promise<UserProfile | null>;
//   1. Read auth user; return null if signed out.
//   2. SELECT * FROM users WHERE id = auth.uid().
//   3. Return.

export async function setIPODate(input: {
    ipo_date: string;                   // YYYY-MM-DD
    baseline_assessment_text: string;   // 3 sentences
    display_name?: string;
    ticker_symbol?: string;
}): Promise<void>;
//   1. Validate ipo_date is a real date and not in the future.
//   2. Validate baseline_assessment_text is 20..2000 chars.
//   3. UPDATE users SET ipo_date = $1, baseline_assessment_text = $2,
//        display_name = COALESCE($3, display_name),
//        ticker_symbol = COALESCE($4, ticker_symbol)
//        WHERE id = auth.uid().
//   4. revalidatePath('/dashboard').
```

```typescript
// actions/earnings.ts
export type EarningsLetter = {
    id: string;
    year: number;
    quarter: 1 | 2 | 3 | 4;
    text: string;
    percent_change: number;
    events_used: number;
    generated_at: string;
};

export async function generateQuarterlyLetter(input: {
    year: number;
    quarter: 1 | 2 | 3 | 4;
}): Promise<EarningsLetter>;
//   1. Read current user.
//   2. SELECT existing letter — if exists, return it (idempotent).
//   3. SELECT entries for that quarter for this user.
//   4. If 0 entries → throw NoEntriesInQuarterError.
//   5. Compute percent_change for the quarter (price at end / price at start - 1).
//   6. Call generateLetter() from lib/llm/earnings-letter with entries + percent_change.
//   7. INSERT INTO earnings_letters.
//   8. Return.

export async function getQuarterlyLetter(input: {
    year: number;
    quarter: 1 | 2 | 3 | 4;
}): Promise<EarningsLetter | null>;
//   SELECT existing letter or return null.
```

```typescript
// lib/llm/score.ts (called by createEntry; also exported for testing)
export type ScoreResult = {
    score: number;
    magnitude: 'small' | 'medium' | 'large';
    category: string;
    reasoning: string;
    rubric_version: number;
};

export async function scoreEntry(
    text: string,
    opts?: { baseline_assessment_text?: string | null }
): Promise<ScoreResult>;
//   1. Look up current rubric version (hardcoded to 1 in V0; stored in lib/llm/prompts.ts).
//   2. Build messages: system = rubric + system instructions; user = event + baseline.
//   3. Call generateObject({ model: anthropic('claude-3-5-sonnet'), schema, messages, maxRetries: 1 }).
//   4. Validate result is in valid ranges (Zod already does this; double-check score ∈ [-10, 10]).
//   5. Return result with rubric_version attached.
```

```typescript
// lib/price.ts — pure function, no DB, no React, no Next. Called from
// the server component (app/dashboard/page.tsx) to pre-compute the series
// once per page load and ship it as a prop to the client <PriceChart>.
// Runs in any environment because it has no dependencies.
export type PricePoint = {
    date: string;             // ISO date
    price: number;
    entry_id: string;
    entry_text: string;       // for tooltip
    score: number;
    magnitude: 'small' | 'medium' | 'large';
};

export function computePriceSeries(input: {
    baseline_price: number;
    ipo_date: string;
    entries: Array<Pick<Entry, 'id' | 'created_at' | 'text' | 'score' | 'magnitude'>>;
}): PricePoint[];
//   1. Sort entries by created_at ASC.
//   2. Start with [{ date: ipo_date, price: baseline_price, entry_id: 'ipo', ... }] as a synthetic anchor point.
//   3. For each entry: price = previous_price * (1 + score / 100). Append.
//   4. Return.
```

---

## 4. LLM prompt templates

All prompts live in `lib/llm/prompts.ts` as exported constants. Pin them. When you change them, bump the rubric_version and INSERT a new row.

```typescript
// lib/llm/prompts.ts
export const CURRENT_RUBRIC_VERSION = 1;

export const SCORE_SYSTEM_MESSAGE = `
You are a calibrated scorer for trade-yourself, a personal growth chart that models
a person's life as a stock price. The user writes what happened to them. You convert
that event into a number between -10 and +10 representing the event's impact on
their personal trajectory.

THE RUBRIC (apply consistently — same event must always get a similar score):

+10  life-defining positive event (marriage, child born, breakthrough recovery)
+7   major milestone (new job, finished degree, big move, published work)
+4   meaningful win (good feedback, finished hard project, healed a relationship)
+2   small good day (workout streak, learned something, kind moment)
 0   neutral / routine
-2   small setback (rough day, minor conflict)
-4   meaningful loss (rejection, missed goal, fight)
-7   major hit (job loss, breakup, family conflict)
-10  life-defining negative event (death, serious illness, divorce)

CALIBRATION RULES:
- Bias toward smaller scores. Most days are -2 to +2. Reserve +/-7 for events that
  genuinely change the writer's trajectory.
- Score the event itself, not how the writer feels about it. Someone winning a major
  prize and feeling numb is still a +7 event.
- Consider novelty (is this a first?), durability (does this last beyond a week?),
  and trajectory change (does this redirect their life?).
- If the event is mixed (a win and a loss), score the net impact and explain in
  reasoning.
- Decimal scores are allowed (e.g., +3.5 for a win that's between "small good day"
  and "meaningful win").

OUTPUT JSON matching the schema below.
- category: one of: career, relationships, health, learning, creative, family,
  finance, lifestyle, mental_health, other.
- reasoning: one sentence explaining why this score, in plain English, written so
  the user can re-read it months later and understand it.

(magnitude is computed server-side from |score| — do not include it in the output.)
`.trim();

export const SCORE_USER_TEMPLATE = (event: string, baseline: string | null) => `
Event: ${event}

${baseline ? `Baseline (who I was on my IPO date):\n${baseline}` : 'Baseline: not provided.'}
`.trim();
```

```typescript
// lib/llm/score.ts
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { SCORE_SYSTEM_MESSAGE, SCORE_USER_TEMPLATE, CURRENT_RUBRIC_VERSION } from './prompts';

// LLM returns score, category, reasoning. Magnitude is computed deterministically
// from |score| in createEntry — see actions/entries.ts.
const ScoreSchema = z.object({
    score: z.number().min(-10).max(10),
    category: z.enum(['career', 'relationships', 'health', 'learning',
                      'creative', 'family', 'finance', 'lifestyle',
                      'mental_health', 'other']),
    reasoning: z.string().min(1).max(500),
});

export async function scoreEntry(text: string, opts?: { baseline_assessment_text?: string | null }) {
    const { object } = await generateObject({
        model: anthropic('claude-3-5-sonnet-20241022'),
        schema: ScoreSchema,
        system: SCORE_SYSTEM_MESSAGE,
        prompt: SCORE_USER_TEMPLATE(text, opts?.baseline_assessment_text ?? null),
        maxRetries: 2,    // 2 = SDK default; one retry for transient API errors, no more (cost cap).
    });
    return { ...object, rubric_version: CURRENT_RUBRIC_VERSION };
}

// Pure helper, called from actions/entries.ts after scoreEntry returns.
export function magnitudeFromScore(score: number): 'small' | 'medium' | 'large' {
    const abs = Math.abs(score);
    if (abs >= 7) return 'large';
    if (abs >= 3) return 'medium';
    return 'small';
}
```

```typescript
// lib/llm/earnings-letter.ts
export const EARNINGS_LETTER_PROMPT = (input: {
    display_name: string;
    year: number;
    quarter: 1 | 2 | 3 | 4;
    percent_change: number;
    entries: Array<{ created_at: string; text: string; score: number; category: string }>;
}) => `
You are the CEO of ${input.display_name} Inc. Write a one-paragraph quarterly
shareholder letter summarizing the events of Q${input.quarter} ${input.year}, in
formal CEO-speak. The letter must:

- Be honest. Acknowledge dips and setbacks; do not paper over hard months.
- Reference at least 2-3 actual events from the quarter, framed in the corporate
  metaphor (e.g., "we expanded into the relationships vertical with…", "we faced
  headwinds from…").
- End with one forward-looking sentence about trajectory.
- Be 4-7 sentences. No bullet points.
- Tone: a real shareholder letter, not a horoscope. If the quarter was bad, say it
  was bad with corporate dignity.

Quarter performance: ${input.percent_change >= 0 ? '+' : ''}${input.percent_change.toFixed(2)}%

Events from this quarter (chronological):
${input.entries.map(e => `- [${e.created_at.slice(0, 10)}] (${e.category}, score ${e.score}) ${e.text}`).join('\n')}

Output: the letter as plain text. No greeting, no signoff, no quotation marks.
`.trim();

export async function generateLetter(input: ...): Promise<string> {
    const { text } = await generateText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        prompt: EARNINGS_LETTER_PROMPT(input),
        maxRetries: 1,
    });
    return text.trim();
}
```

---

## 5. Chart component skeleton

```typescript
// components/PriceChart.tsx
'use client';
import { LineChart } from '@tremor/react';
import { useState } from 'react';
import type { PricePoint } from '@/lib/price';

interface PriceChartProps {
    data: PricePoint[];
    baselinePrice: number;
    onPointClick: (entryId: string) => void;
}

export function PriceChart({ data, baselinePrice, onPointClick }: PriceChartProps) {
    const currentPrice = data.at(-1)?.price ?? baselinePrice;
    const isUp = currentPrice >= baselinePrice;

    return (
        <LineChart
            className="h-80"
            data={data}
            index="date"
            categories={['price']}
            colors={[isUp ? 'emerald' : 'rose']}
            valueFormatter={(n) => `$${n.toFixed(2)}`}
            yAxisWidth={64}
            showAnimation
            showGridLines
            showLegend={false}
            onValueChange={(v) => {
                // Tremor surfaces the clicked datum here. Map back to entry_id.
                if (v && 'entry_id' in v && typeof v.entry_id === 'string' && v.entry_id !== 'ipo') {
                    onPointClick(v.entry_id);
                }
            }}
            customTooltip={({ payload }) => {
                const point = payload?.[0]?.payload as PricePoint | undefined;
                if (!point) return null;
                return (
                    <div className="rounded-md border bg-background p-2 shadow">
                        <div className="text-xs text-muted-foreground">{point.date}</div>
                        <div className="text-sm font-medium">${point.price.toFixed(2)}</div>
                        <div className="text-xs mt-1 max-w-xs truncate">{point.entry_text}</div>
                        <div className="text-xs text-muted-foreground">click to read</div>
                    </div>
                );
            }}
        />
    );
}
```

```typescript
// components/EntryModal.tsx
'use client';
interface EntryModalProps {
    entryId: string | null;
    onClose: () => void;
}
// On mount when entryId !== null: call getEntry(entryId), display:
//   - Created date (formatted)
//   - Full text (whitespace preserved)
//   - Score badge (color-coded by sign)
//   - Category chip
//   - LLM reasoning (italic, smaller)
//   - Rubric version footnote
//   - Close button
```

**Reference line at baseline:** Tremor's LineChart doesn't natively support reference lines. Two options:
1. Inject a synthetic horizontal series at `baseline_price` and color it gray. Simplest.
2. Overlay an absolute-positioned `<div>` at the y-coordinate corresponding to `baseline_price`. More work.

V0 default: **option 1** (synthetic series).

---

## 6. Onboarding flow — every screen

| # | Path | What user sees | What ships it | Server-side guard |
|---|---|---|---|---|
| 1 | `/` | Logo, "trade-yourself: a personal stock chart of you", CTA "Sign in" | Landing page | If `auth.user` exists and `users.ipo_date != null` → redirect `/dashboard`. If `auth.user` exists and `ipo_date == null` → redirect `/onboarding`. |
| 2 | `/login` | Email field, "Send magic link" button. Submit → "Check your email." | `app/login/page.tsx` | If already signed in → redirect `/`. |
| 3 | (email link) | User clicks link in their email. | Supabase magic-link mechanics | — |
| 4 | `/auth/callback` | Spinner, then redirect | `app/auth/callback/route.ts` exchanges code for session | Always redirect: to `/onboarding` if `ipo_date == null`, otherwise `/dashboard`. |
| 5 | `/onboarding` | "Welcome." Date picker labeled "Pick your IPO date — a day that means something to you." Textarea labeled "In 3 sentences, who were you on that day?" Placeholder helps: "Where were you living? What were you doing? What were you afraid of?" Submit. | `BaselineForm` calls `setIPODate` | Redirect to `/dashboard` if `ipo_date != null` (no second onboarding). |
| 6 | `/dashboard` | Header (ticker, current price, % vs baseline). Chart. Textbox: "What happened today?" (submit btn). Below chart: "Generate Q3 letter" button, enabled if quarter has entries and no letter cached. | `app/dashboard/page.tsx` | Redirect to `/onboarding` if `ipo_date == null`. |
| 7 | `/dashboard` (after submit) | Optimistic point appears on chart immediately. Real point replaces it after `createEntry` resolves. Toast on error. | `EntryTextbox` + `useOptimistic` hook | — |
| 8 | Click chart point | `EntryModal` opens with full entry. | `PriceChart.onPointClick` → `EntryModal` | — |
| 9 | `/dashboard/entry/[id]` | Permalinked version of the modal. Shareable URL (only the owner can read it; RLS enforces this). | `app/dashboard/entry/[id]/page.tsx` | 404 if not owner. |

**Visual hierarchy on the dashboard:** Header (price) > Chart (visual focal point) > Textbox (call to action) > Earnings button (secondary). Don't add a sidebar, don't add tabs, don't add a settings page. V0 ships with one screen.

---

## 6.5 Visual specs for the two contentful V0 screens

These are the per-pixel decisions for the screens that determine whether V0 feels like a product or a prototype. The other screens (login, landing redirect) inherit defaults from Section 0.

### 6.5.1 — IPO baseline onboarding (`/onboarding`)

This screen ships ONCE per user. It must feel like a moment, not a form.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│                                                          │
│         ONE QUICK THING                                  │   <- caption, var(--text-subtle), letter-spacing 0.1em, uppercase
│                                                          │
│         Pick the day you went public.                    │   <- display-xl serif, var(--text)
│                                                          │
│         Choose a date that means something to you.       │   <- body-lg, var(--text-muted)
│         It becomes the version of yourself everything    │
│         else is measured against.                        │
│                                                          │
│         ┌────────────────────────────────────┐           │
│         │  Mar 4, 2024                  📅  │           │   <- native date picker, body, --surface bg, --border
│         └────────────────────────────────────┘           │
│                                                          │
│         In three sentences, who were you on that day?    │   <- body, var(--text-muted), label
│         ┌────────────────────────────────────┐           │
│         │  Where were you living?            │           │   <- body, --surface, 5 rows, max 600 chars
│         │  What were you doing?              │           │
│         │  What were you afraid of?          │           │
│         │                                    │           │
│         │                                    │           │
│         └────────────────────────────────────┘           │
│                                                  342     │   <- char counter, caption, var(--text-subtle)
│                                                          │
│                                                          │
│         ┌─────────────────┐                              │
│         │  Mark this day  │                              │   <- body, --text on --bg, 1px --border, 12x32px padding
│         └─────────────────┘                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Container:** centered, max-width 640px, `padding: 96px 24px 64px`. No top nav. No logo. No sidebar. The only chrome is the page itself.

**Hierarchy:** the heading is the visual anchor. Everything supports it. The user reads top-to-bottom in a single straight line.

**The kicker label** ("ONE QUICK THING") — small, uppercase, letter-spaced, color `--text-subtle`. It signals *this is the only step* and reduces commitment anxiety. Without it the user wonders if they're about to fill out a 12-step wizard.

**The heading** — display-xl serif. This is the only place where serif appears in V0. It earns it because this screen is a moment.

**The subtitle** — body-lg, `--text-muted`. Two sentences max. Explains the IPO concept in plain English.

**Date picker** — native `<input type="date">` styled to fit the dark theme (border `--border`, bg `--surface`, text `--text`). No fancy custom widget; the native picker on Mac/iOS/Android is a known good UX. `max` attribute set to today (no future dates).

**Textarea** — 5 rows, max-length 600. Placeholder copy is the three questions, line-broken. Char counter bottom-right of the textarea (caption, `--text-subtle`). Goes orange at 500 chars (only).

**Submit button** — labeled `Mark this day` (NOT "Submit", NOT "Continue", NOT "Save"). The label is part of the moment. Disabled if date is empty OR baseline text is < 20 characters. On click: 80ms scale-down, then submit. On success: brief 300ms fade-out, then route to /dashboard.

**Empty validation states** (the user clicks Submit too early):
- No date picked: date picker outline turns `--down` (rose), microcopy below picker: "Pick a date first."
- Date in future: same outline, microcopy: "Pick a date in the past — your IPO already happened."
- Baseline text < 20 chars: textarea outline turns `--down`, microcopy: "A few more words. The LLM uses this to anchor your early scores."

**Loading state** (after Submit, while server action runs):
- Button label changes to "Saving..." (no spinner)
- Button disabled
- If save takes > 2s, button label changes to "Still saving... (your draft is safe)"

**Error state** (server action throws):
- Toast in top-right corner: `--surface-2` bg, `--border`, body text. Copy: "Couldn't save. Try again?"
- Form state preserved (date and text remain).

**What this screen DELIBERATELY does NOT have:**
- No "Skip for now" link. The IPO date IS the product; you can't skip it.
- No optional fields beyond date + text. No display name picker. No avatar upload. No theme toggle. The trigger sets `display_name` from email; users edit later in V0.5+.
- No preview of what the chart will look like. Tease later, don't tease now.
- No social proof, testimonials, "join 10k other users" — the product is intimate, social proof contradicts the tone.

### 6.5.2 — Main dashboard (`/dashboard`)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  $RAYH                            $127.43    +27.43% │   <- header. ticker mono. price display-lg mono. % up green / down rose.
│                                   since Mar 4, 2024            │   <- caption muted, baseline date
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │              ╭─╮                                          │  │
│  │             ╱   ╲    ╭─╮                                  │  │  <- chart. 1px line, --up or --down. baseline as dashed --baseline.
│  │       ╭───╯     ╰───╯   ╲       ╭──                      │  │
│  │   ╱──╯  · · · · · · · · · ╲────╯                          │  │  <- baseline ($100) as dashed line at fixed y
│  │ ─╯                                                         │  │
│  │                                                           │  │
│  │ Mar 24    Jun 24    Sep 24    Dec 24    Mar 25  Mar 26   │  <- caption muted, var(--text-subtle)
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  What happened today?                                     │  │  <- body, --text-muted placeholder, --surface bg, --border
│  │                                                           │  │  <- 3 rows, autoresize up to 8 rows
│  └───────────────────────────────────────────────────────────┘  │
│                                                              ↩  │  <- caption: "Cmd+Enter to submit"
│                                                                 │
│  Letters appear at the end of each quarter.                     │  <- secondary action area; if quarter has >=1 entry, becomes "Generate Q2 letter →"
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Container:** centered, max-width 880px, `padding: 48px 32px`.

**Header (top):** flex row, baseline-aligned.
- Ticker `$RAYH` — mono, 16px, `--text-muted`, letter-spacing 0.05em
- Spacer, then current price `$127.43` — mono, display-lg, `--text`. The visual anchor of the page.
- Adjacent, percent change `+27.43%` — mono, body-lg, color `--up` if positive `--down` if negative.
- Below price (smaller, caption): `since Mar 4, 2024` — `--text-subtle`. So users always remember what the baseline is.

**Chart:** 320px tall. `border: 1px solid --border`, `--surface` background, `border-radius: 8px`, padding 16px.
- Line: 1.5px, color `--up` if `current_price >= baseline_price` else `--down`. Single line, no fill below.
- Baseline reference: a horizontal dashed line at `y = baseline_price`, color `--baseline`, 1px, `stroke-dasharray: 4 4`. Always visible, regardless of where the current price is.
- Axis: x = months (Tremor's date formatting, customized via `valueFormatter`), y = price ($). Both axes captioned in `--text-subtle`. No gridlines (Tremor default has them — turn them off; clutter).
- Hover: tooltip shows date (caption), price (mono), and a 1-line truncation of the entry text. Tooltip bg `--surface-2`, `--border`, `border-radius: 6px`.
- Click on a point: opens `<EntryModal>` with that entry. (The `onValueChange` quirk noted in the eng review may mean swapping to Recharts directly here.)

**Textbox (below chart):**
- Placeholder: `What happened today?` — body, `--text-muted`.
- 3 rows initially. Auto-resizes up to 8 rows as user types.
- Submit on Cmd+Enter / Ctrl+Enter. Visual hint below textbox in caption: `Cmd+Enter to submit`.
- No visible Submit button by default — the keyboard shortcut IS the submit. (Power-user signal. If usability testing shows confusion, add a button later.)
- On submit: textbox locks (read-only) + opacity 0.6 + caption changes to "Scoring...". When server action returns: chart animates in the new point (240ms fade + scale per Section 0 motion), then textbox clears and unlocks.

**Earnings letter area (below textbox):**
- If current quarter has 0 entries: caption text in `--text-subtle`: "Letters appear at the end of each quarter." No button visible.
- If current quarter has ≥1 entries: a small text-link button: `Generate Q2 letter →`. Body, color `--text-muted`, hover `--text`. No background, no border, just text. (Subtraction default — this is secondary.)
- Click opens a modal showing the generated letter. Same modal style as `<EntryModal>`.

**Empty state (zero entries):**
- The chart shows ONE point at the IPO date with `y = baseline_price`. No line (one point can't make a line).
- Header: ticker + `$100.00` + `+0.00%` + `since Mar 4, 2024`.
- Textbox placeholder changes to: `Write your first entry. The chart will start tracking from today.`
- Earnings letter area shows the empty caption (no button).

**Loading state (initial page load):**
- Header shows skeletons (3 thin gray rounded bars sized to ticker, price, %) animated with subtle shimmer.
- Chart area shows a thin centered caption: "Loading your chart..." in `--text-subtle`. No spinner. No fake skeleton chart.

**Error state (data fetch fails):**
- Top of page banner (full-width strip): `--down` color text, body. Copy: "Couldn't load your data. Try refreshing — your entries are safe in the database."
- Below the banner: nothing else renders (no broken half-loaded chart).

**Mobile viewport (<= 640px):**
- Header stacks: ticker on its own line; price + % on the next line; baseline date on the third line.
- Chart shrinks to viewport width minus padding. Aspect ratio relaxes from 320px to ~240px tall.
- Textbox spans full width.
- Touch target on chart points: 44px minimum hit zone (Tremor may need a custom invisible overlay).
- Cmd+Enter doesn't exist on phones; show a small `Submit ↩` button below the textbox.

---

## 7. Error states

| Failure | What user sees | What we do |
|---|---|---|
| LLM API timeout (>30s) | Toast: "Scoring is taking longer than expected — try again?" | Reject the createEntry. Don't persist. Keep textbox content. |
| LLM returns invalid JSON | Toast: "Couldn't score that entry. Try rephrasing." | Don't save. Log error server-side (`console.error` is fine for V0). |
| LLM returns score outside [-10, 10] | Treated like invalid JSON (Zod will catch this). | Don't save. |
| Empty or whitespace-only entry | Submit button disabled. | — |
| Entry > 2000 chars | Char counter goes red past 1500. Submit disabled past 2000. | — |
| Supabase insert fails | Toast: "Couldn't save. Check your connection and retry." | Keep textbox content. Surface retry button. |
| Magic link expired | `/auth/callback` shows "Link expired — sign in again." with a button back to `/login`. | — |
| User has no `ipo_date` and lands on `/dashboard` | Server-side redirect to `/onboarding`. | — |
| Quarter has 0 entries when user clicks "Generate letter" | Button is disabled. Tooltip: "No entries in Q3 — log something first." | — |
| Earnings letter LLM fails | Toast: "Couldn't generate letter — try again." | Don't persist. Retry button. |
| User is offline | Top banner: "You're offline. Saving is paused." | Disable submit. Queueing offline writes is V1+. |
| Two tabs open, both submit | Second submit: server inserts both. The chart will have two points. | Acceptable for V0. Real fix is idempotency keys, V1+. |
| LLM cost cap exceeded (V0.5+) | Toast: "Daily limit reached — try tomorrow or self-host." | Block submit. Hosted version only. |

---

## 8. Build order (expanded)

The 8 steps from the design doc, with files to touch and an acceptance criterion per step. Don't move on until the acceptance criterion passes for real.

### Step 1 — Calibrate the rubric (offline, no code)

**Files:** none. Pen and paper or a Notion doc.

**Do:**
- Pick 10 real events from your past year. Mix of wins, losses, neutral.
- Score each one against the rubric in the design doc. Write the score down.
- Show the 10 events to a friend who knows you well. Ask them to score each one with the same rubric.
- Compare. If their scores cluster within ±2 of yours on at least 8 of 10 events, the rubric is good. If not, edit the rubric anchors and re-test.

**Acceptance:** rubric is calibrated against 10 real events with ≤±2 disagreement on at least 8 of 10.

### Step 2 — Bootstrap the repo

**Commands:**
```bash
cd ~/Documents/GitHub/trade-yourself
bunx create-next-app@latest . --typescript --app --tailwind --no-src-dir --import-alias "@/*"
# If prompted about overwriting CLAUDE.md / NEXT_STEPS.md / PLAN.md — say NO. Keep them.
bun add @tremor/react @ai-sdk/anthropic ai zod date-fns
bun add @supabase/supabase-js @supabase/ssr
bun add -D @types/node
```

**Files created:** standard create-next-app output. Preserve `CLAUDE.md`, `NEXT_STEPS.md`, `PLAN.md`.

**Acceptance:** `bun dev` runs and serves the default Next.js page on `http://localhost:3000`.

### Step 3 — Set up Supabase + auth + schema

**Do:**
1. Sign up at supabase.com. Create a new project. Note the URL and anon key.
2. In `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Add `.env.local` to `.gitignore` (create-next-app already does this — verify).
4. Create `.env.example` with the same keys, blank values. Commit it.
5. Create `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (server). Reference: https://supabase.com/docs/guides/auth/server-side/nextjs
6. Open Supabase SQL editor. Paste `supabase/migrations/0001_initial.sql` (Section 2 of this doc). Run it.
7. Paste `supabase/seed.sql` with the rubric text. Run it.
8. In Supabase Auth settings: enable Email auth, magic link mode. Set Site URL to `http://localhost:3000` (and to your Vercel URL once deployed). Redirect URLs: `http://localhost:3000/auth/callback` and the deployed equivalent.
9. Create `app/login/page.tsx` and `app/auth/callback/route.ts`.

**Acceptance:** sign in via magic link, see your row in `auth.users` AND in `public.users` (created by the trigger), session persists across page reloads.

### Step 4 — scoreEntry server action + entry creation (no chart yet)

**Files to create:**
- `lib/llm/prompts.ts` — paste the prompts from Section 4
- `lib/llm/score.ts` — paste from Section 4
- `actions/entries.ts` — `createEntry`, `getEntries`, `getEntry`
- `app/dashboard/page.tsx` — temporary version: textbox + a list of entries showing date, text, score, reasoning

**Acceptance:** type "I had a hard conversation with my dad" into the textbox, submit, see it appear in the list with a score in [-10, 10] and a reasoning that feels right. Try 5 more entries. The scores should cluster as the rubric predicts.

### Step 4.5 — Unit tests for the price formula (mandatory, ~30 min)

**Why:** the chart breaks silently if `computePriceSeries` is wrong. This is the single highest-leverage test in V0 — pure function, no mocking, no LLM cost.

**Commands:** `bun add -D vitest @testing-library/react @testing-library/jest-dom happy-dom` and add `"test": "vitest"` to package.json scripts.

**Files to create:** `lib/price.test.ts`. Cover at minimum:
- empty entries → returns `[{ date: ipo_date, price: 100, entry_id: 'ipo' }]`
- one entry score=+5 → second point's price = 105
- two entries +5 then -5 → final price = 100 × 1.05 × 0.95 = 99.75 (NOT 100, compounding asymmetry — this is the bug a beginner ships)
- negative score sequence compounds correctly
- entries out of chronological order get sorted before computing

**Acceptance:** `bun run test` passes with all five cases green. The asymmetry test (case 3) is the one that proves you got compounding right.

### Step 4.6 — LLM scoring eval suite (mandatory, ~1.5 hr)

**Why:** the rubric IS the product (Premise 3 of the design doc). A prompt change can silently break it. Without this eval, you don't know the rubric is broken until the chart looks weird three weeks later.

**Files to create:**
- `evals/score-rubric.test.ts` — Vitest test that loads the 10 calibration events from Step 1, runs each through `scoreEntry`, asserts each score is within ±2 of your hand-calibrated expectation
- `evals/calibration-events.json` — your 10 events with expected scores

**Test shape:**
```typescript
import { scoreEntry } from '@/lib/llm/score';
import calibration from './calibration-events.json';
import { describe, it, expect } from 'vitest';

describe('rubric calibration', () => {
    for (const c of calibration) {
        it(`${c.label}: scores near ${c.expected_score}`, async () => {
            const result = await scoreEntry(c.event_text);
            expect(Math.abs(result.score - c.expected_score)).toBeLessThanOrEqual(2);
        }, 30_000);
    }
});
```

This costs ~10 cents per full run (10 entries × ~$0.01 each). Run on every prompt change. Don't run in CI on every push — gate it behind `bun run test:eval` to keep CI cheap.

**Acceptance:** all 10 calibration events score within ±2 of your hand-calibrated value. If any case fails, fix the rubric, not the test.

### Step 5 — The chart

**Files to create:**
- `lib/price.ts` — `computePriceSeries`
- `components/PriceChart.tsx` — Tremor LineChart wrapper
- `components/EntryModal.tsx` — modal/drawer

**Files to modify:**
- `app/dashboard/page.tsx` — replace the entries list with `<PriceChart>`. Wire click handler to open `<EntryModal>`.

**Acceptance:** chart renders with at least 5 of your test entries from Step 4, the line moves correctly (price = baseline × Π(1 + score_i / 100)), clicking a point opens the modal showing that entry's text.

### Step 6 — IPO baseline onboarding

**Files to create:**
- `app/onboarding/page.tsx`
- `components/BaselineForm.tsx` — date picker + textarea
- `actions/user.ts` — `setIPODate`, `getCurrentUser`

**Files to modify:**
- `app/page.tsx` (landing) — add the redirect logic from Section 6 (table row 1)
- `app/dashboard/page.tsx` — add the server-side guard (redirect to `/onboarding` if `ipo_date == null`); pass `ipo_date` and `baseline_price` to `<PriceChart>` so the x-axis starts at the IPO date

**Acceptance:** wipe your `users` row's `ipo_date` (or sign up a fresh account). Sign in. Land on `/onboarding`. Pick a date 6 months ago. Write 3 sentences. Submit. Land on `/dashboard` with the chart starting at that date.

### Step 7 — Quarterly earnings letter

**Files to create:**
- `lib/llm/earnings-letter.ts` — paste from Section 4
- `actions/earnings.ts` — `generateQuarterlyLetter`, `getQuarterlyLetter`
- `components/EarningsLetterButton.tsx`

**Files to modify:**
- `app/dashboard/page.tsx` — add the button below the chart. Disabled if 0 entries in current quarter or letter already cached. On click, generate and display in a modal.

**Acceptance:** with at least 5 entries in the current quarter, click the button. The letter:
- References at least 2 actual events you logged
- Reads like a real shareholder letter (not a horoscope)
- Has a forward-looking final sentence
- Persists to `earnings_letters` so re-clicking shows the cached version, not a new one

### Step 8 — Polish + open source

**Do:**
1. Decide MIT vs AGPL. Write `LICENSE`.
2. Write `README.md`: what is this, screenshot, "run locally" instructions, "deploy your own" instructions, link to the design doc and PLAN.md.
3. Verify `.env.example` is complete.
4. Add a GitHub Actions workflow at `.github/workflows/ci.yml`: install, typecheck, build.
5. Push to GitHub. Make repo public.
6. Connect Vercel to the repo. Set env vars in Vercel dashboard. Auto-deploy on merge to main.
7. Tag `v0.1.0`.

**Acceptance:** a stranger can clone the repo, copy `.env.example` to `.env.local`, fill in their own Supabase + Anthropic keys, run `bun install && bun dev`, and reach a working app on localhost without further help.

---

## 9. Open questions (resolve as you build)

- **License:** MIT or AGPL? AGPL prevents closed-source SaaS on top of your code; MIT is permissive and friendlier to forks. **Recommendation:** MIT for V0 — fewer barriers to people learning from your code. Revisit in V1 if you see commercial scraping.
- **Entry deletion / editing:** V0 doesn't support either. If you log by mistake, the entry stays. **Recommendation:** keep V0 immutable; add soft-delete with chart re-flow in V0.5.
- **Backdating entries:** V0 = `created_at` is server time only. **Recommendation:** keep this in V0. Backdating mixes the LLM's view of "now" with a past timestamp and produces weird scoring drift. Revisit if you genuinely need it.
- **Privacy / encryption-at-rest:** Supabase uses transparent disk encryption. No column-level encryption in V0. **Recommendation:** good enough; document it in README so users know.
- **Ticker symbol generation:** for V0, default to first 4 chars of email or display_name uppercased. User-editable. **Recommendation:** do this lazily (set on first dashboard visit if NULL).
- **Cost cap:** no per-user daily limit in V0. **Recommendation:** log usage to a `usage_log` table from day one (timestamp, user_id, action, tokens_in, tokens_out, cost_usd) so you can analyze before deciding caps. Adds maybe an hour to Step 4. Worth it.
- **Data export format:** V0 ships JSON export at `/dashboard/export`. **Recommendation:** add it in Step 8 as a polish item — one server action that selects all entries and returns as a JSON download. Markdown export is V0.5.
- **Earnings letter regeneration:** V0 caches once, no regenerate button. **Recommendation:** keep this — it forces the LLM to be good on the first try, which is the actual product quality bar.

---

## 10. Notes for the next session

- **Before any code:** Section 8 Step 1. Calibrate the rubric on paper. The single highest-leverage action.
- **First code commit:** end of Step 2 (bootstrapped Next.js project).
- **First "I'm building something real" moment:** end of Step 4 (you can score events and see them listed).
- **First demo-able:** end of Step 5 (chart works, click-to-reread works).
- **First viral artifact:** end of Step 7 (earnings letter generates from real data).
- **First public commit:** end of Step 8 (license + README + Vercel deploy).

When you come back: open this file and start at Section 8, Step 1. Don't reread the design doc unless you want to — this PLAN is downstream of it. If something here disagrees with the design doc, the design doc wins.

---

## Approved Mockups

| Screen/Section | Mockup Path | Direction | Notes |
|----------------|-------------|-----------|-------|
| IPO Baseline Onboarding | _(pending — generate via Claude with Brief 1 from /plan-design-review session, then save to ~/.gstack/projects/rayyanh192-trade-yourself/designs/ and update this row)_ | Editorial / Substack onboarding feel | Centered single-column, 640px, dark mode default. See Section 6.5.1 for per-pixel specs. |
| Main Dashboard | _(pending — generate via Claude with Brief 2, then save and update this row)_ | Bloomberg terminal × journal | Mono numbers, single accent line, baseline reference. See Section 6.5.2. |

When you generate mockups in Claude, save the chosen variant per screen, then come back and replace the "_pending_" cells with the actual file paths. The visual specs in Section 6.5 are the implementer's source of truth either way; the mockups are the visual reference to match against once code starts rendering.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | clean | 10 issues, 3 P1/P2 contentful (resolved), 7 auto-applied, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | clean | score: 4/10 → 8/10, palette + type scale + motion + 2 screen specs added, mockups deferred to user-generated |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**UNRESOLVED:** 0

**VERDICT:** ENG + DESIGN CLEARED — ready to implement. Visual mockups deferred to user (Briefs 1 + 2 from /plan-design-review session). DESIGN.md still missing — recommend `/design-consultation` after V0 ships if you want a real design system before V1. CEO review not needed for a personal open-source project.

**Key changes from this review (applied to PLAN.md above):**
- Magnitude is now computed server-side from `|score|` via `magnitudeFromScore()`. LLM no longer returns it. Drops a divergence bug.
- Rubric is single-sourced in `lib/llm/prompts.ts`. `supabase/seed.ts` (Bun script) imports it and seeds the DB. No more drift between code and DB.
- Step 4.5 added: unit tests for `lib/price.ts`. Catches compounding-formula bugs.
- Step 4.6 added: LLM eval suite using the 10 calibration events from Step 1. Catches rubric drift on prompt changes.
- `display_name` defaults to email username via the auth trigger. Earnings letter prompt no longer risks "CEO of null Inc."
- `lib/supabase/server.ts` clarified to use anon key + user session (RLS still applies). Service role moved to a separate `lib/supabase/admin.ts`, used only by the seed script.
- `lib/price.ts` clarified to run server-side, with the result shipped as a prop to a client `<PriceChart>`.
- Composite index `idx_entries_user_rubric` added for V0.5 re-scoring queries.
- `createEntry` walkthrough hardened: errors propagate without clearing the textbox.

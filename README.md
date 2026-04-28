# youinc

A personal stock chart of your life. You write what happened today; an LLM scores
the event against a calibrated rubric; the chart updates. Over months and years,
the chart becomes a visualization of growth that your in-the-moment feelings
can't give you.

The animating insight: people with a high bar for themselves often can't feel
their own growth. Achievements don't register because the internal goalposts
have already moved. Quarterly "earnings letters" written in CEO-speak resurface
the events you logged so the line going up has receipts to back it.

Open source. Self-hostable. Built with Next.js, Supabase, Anthropic Claude.

## Stack

- **Next.js 16** (App Router) on Vercel
- **TypeScript** + **Tailwind**
- **Tremor** for charts
- **Vercel AI SDK** with **Anthropic Claude Sonnet** for scoring + letters
- **Supabase** for auth + Postgres (with Row Level Security)
- **Bun** as runtime + package manager
- **Vitest** for unit tests + LLM eval

## Run locally

You need a Supabase project, an Anthropic API key, and Bun. The whole local
setup is ~10 minutes.

```bash
git clone <your-fork-url>
cd youinc
bun install
cp .env.example .env.local      # then fill in your keys
```

Fill `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-api03-...
```

In your Supabase dashboard:

1. Create a new project. Note the URL + anon key.
2. **SQL Editor → New query**. Paste the contents of `supabase/migrations/0001_initial.sql`. Run.
3. **Authentication → Sign In / Up → Email**. Enable Email auth (magic link).
4. **Authentication → URL Configuration**. Set Site URL = `http://localhost:3000`. Add Redirect URL = `http://localhost:3000/auth/callback`.
5. Grab the **service_role** key from Project Settings → API. Run the seed script:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
bun run seed
```

Then:

```bash
bun dev
```

Open `http://localhost:3000`. Sign in. Pick your IPO date. Start logging.

## Tests

```bash
bun run test          # fast unit tests (price-formula compounding, ~1s)
bun run test:eval     # LLM eval against the rubric (~$0.10/run with Sonnet)
```

The eval is gated behind `test:eval` so CI never burns API credits. Run it
locally any time you change the rubric in `lib/llm/prompts.ts`.

## Project structure

```
app/                 Next.js App Router
  page.tsx           Redirect router (signed-out -> /login; no IPO -> /onboarding; else /dashboard)
  login/             Magic-link sign-in
  auth/callback/     Supabase auth callback (sets session cookie)
  onboarding/        IPO baseline form (one-time)
  dashboard/         The real dashboard — header + textbox + chart + entries
components/          UI components (chart, modal, textbox, baseline form, letter button)
actions/             Server actions (entries, user, earnings)
lib/
  llm/               Prompts + scoreEntry + earnings letter
  supabase/          Browser + server clients + session-refresh helper
  price.ts           Pure compounding-price function
evals/               LLM eval against the rubric
supabase/
  migrations/        SQL schema (run once via dashboard)
  seed.ts            Seeds rubric_versions row v1 from lib/llm/prompts.ts
proxy.ts             Next.js 16 proxy (formerly middleware) — refreshes auth cookies
```

## Design rationale

The full design doc and implementation plan live in `PLAN.md` (architecture,
data model, prompts, build order, error states, design system, accessibility
minimums). Read it before contributing.

The most important architectural decisions:

1. **Rubric versioning.** Every entry stores the `rubric_version` it was scored
   under. Bumping the rubric never silently changes historical scores. Manual
   recompute is V0.5+.
2. **`magnitude` is computed server-side from `|score|`.** The LLM doesn't pick
   it. One source of truth.
3. **The rubric IS the product.** It lives in `lib/llm/prompts.ts`. The seed
   script imports from there to seed the DB. The eval test asserts the LLM's
   scores stay within ±2 of human-calibrated expectations.
4. **Retrospective > daily streaks.** No push notifications, no streak counters.
   The product is for the user opening it 8 months from now and feeling something.

## Contributing

Open an issue or PR. The plan in `PLAN.md` lists known V0.5+ items; pick one
and have at it.

## License

MIT — see `LICENSE`.

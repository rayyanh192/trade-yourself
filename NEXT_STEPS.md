# Where I Left Off — trade-yourself

Last session: 2026-04-27

## TL;DR

The design doc is done and approved. Nothing has been built yet. The next thing
to do is **plan out the architecture and finer details before writing any code**.
That means: file structure, exact schema, exact server action signatures, the
prompt template, the chart component skeleton, error states, and the cut order
under deadline pressure.

The design doc gives you the WHAT. The next session will produce the HOW, in a
file in this repo (`PLAN.md` or `ARCHITECTURE.md`) you can build directly from.

## What's done

- gstack installed and configured (telemetry on, proactive on, routing rules in `CLAUDE.md`).
- Empty Next.js-shaped project initialized in git, on `main` branch.
- Office hours session completed. Final design doc approved at 9/10 quality.
- Design doc covers: problem statement, the cross-model "meaning-making not tracking" insight, three implementation approaches, the chosen approach (C: IPO baseline + earnings letter), data model, the calibrated rubric, an 8-step build plan, and a pre-decided "if behind schedule, cut in this order" fallback.

## The design doc — read this first when you come back

```
/Users/rayyan/.gstack/projects/rayyanh192-trade-yourself/rayyan-main-design-20260427-134406.md
```

This file is the source of truth for the product. Don't restart the design phase.
Don't change the chosen approach without good reason. Build from it.

## What's NOT done

- Any code. The repo is empty except for `CLAUDE.md` and this file.
- Architecture document. No `PLAN.md` or `ARCHITECTURE.md` yet.
- Rubric calibration. Per the design doc's pre-build assignment, you should write
  the rubric on paper and score 10 real events from your past year against it,
  ideally with a friend, before writing any code.

## The first thing to do when you start the next session

When you open this project in Claude Code next time, paste this prompt verbatim
into the chat. It will pick up exactly where you left off.

> Read NEXT_STEPS.md and the design doc it references. I want to plan out the
> architecture and finer details for trade-yourself before writing any code.
> Write a file called `PLAN.md` in this repo with the following sections, in
> order:
>
> 1. **File tree** — every file and folder in the project, with one-line purpose for each.
> 2. **Database schema** — exact `CREATE TABLE` statements for `users`, `entries`, `rubric_versions`, with all columns, types, constraints, and indexes. Include the Supabase / Postgres flavor.
> 3. **Server actions** — every server action signature with TypeScript types for inputs and outputs. At minimum: `scoreEntry(text)`, `getEntries()`, `getCurrentPrice()`, `setIPODate(date, baselineText)`, `generateQuarterlyLetter(quarter)`.
> 4. **LLM prompt template** — the full text that gets sent to the model for `scoreEntry`, including the rubric, the output schema (Zod), and the system message. Same for the earnings letter.
> 5. **Chart component skeleton** — Tremor LineChart props, what data it expects, the click-handler shape, the modal it opens.
> 6. **Onboarding flow** — every screen the user sees from sign-in through their first entry, with what each screen does.
> 7. **Error states** — what happens when the LLM call fails, when scoring is ambiguous, when Supabase is down, when the user pastes 10,000 characters.
> 8. **Build order** — the same 8 steps from the design doc, but each step expanded with the specific files to create or edit and the acceptance criterion ("done when X").
> 9. **Open questions** — anything you can't decide without more input from me.
>
> Don't write any application code yet. Just `PLAN.md`. Read the design doc at
> the path in NEXT_STEPS.md before you start. The data model, rubric, and
> chosen approach are already settled there — use them, don't redo them.

## After PLAN.md exists

1. Read it. Push back on anything that feels off.
2. Run `/plan-eng-review` to get an adversarial review of the plan (it'll
   append a `GSTACK REVIEW REPORT` section with findings).
3. Run `/plan-design-review` for the IPO-baseline onboarding UX specifically
   (riskiest UX in V0).
4. Once the plan is solid, start at Step 1 of its Build Order and begin
   actually writing code.

## The pre-build assignment from the design doc — do this offline

> Write the rubric on paper. Score 10 real events from your past year against
> it. Show it to one friend who knows you well and ask if their scoring matches
> yours. If their scores cluster near yours, the rubric is good and the chart
> will feel real. If their scores are wildly different, fix the rubric before
> you start coding.

This is the highest-leverage 30 minutes you can spend on this project. Don't
skip it.

## Useful paths

- Project root: `/Users/rayyan/Documents/GitHub/trade-yourself`
- Design doc: `/Users/rayyan/.gstack/projects/rayyanh192-trade-yourself/rayyan-main-design-20260427-134406.md`
- gstack checkpoints (auto-loaded by `/context-restore`): `/Users/rayyan/.gstack/projects/rayyanh192-trade-yourself/checkpoints/`
- gstack home: `~/.claude/skills/gstack/`
- Bun: `~/.bun/bin/bun` (already on PATH via `~/.zshrc`)

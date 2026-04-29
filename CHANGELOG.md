# Changelog

All notable changes to youinc are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project uses semver loosely while pre-1.0.

## [0.2.0] - 2026-04-29

### Added
- Dashboard redesign from a Claude Design handoff: warm-toned oklch palette, JetBrains Mono / Inter / Source Serif 4 typography, big-ticker header, four-stat strip, custom SVG price chart with hover tooltip and drag-to-select band, score-then-commit entry flow, redesigned earnings letter modal with timeframe picker.
- Earnings letter modal can now save the generated letter as a PNG to your computer (via `html-to-image`).
- `BUGS.md` punch list for known polish items in the redesigned dashboard.

### Changed
- Entry flow is now a two-step preview: `scoreEntryPreview` returns a score + reasoning, then `commitScoredEntry` writes it to the DB. Lets you see what the LLM thinks before persisting the entry.
- Earnings letter narrative trimmed from four paragraphs to one or two sentences plus signoff.
- LLM model bumped from the deprecated `claude-sonnet-4-5` to `claude-haiku-4-5-20251001` for cheaper dev iteration on scoring and earnings letters.
- `globals.css` rewritten to host only design tokens + keyframes; all dashboard layout moved to Tailwind utilities + inline styles for the design tokens (the prior scoped class layer wasn't reliably loading).

### Fixed
- Anthropic API calls 404'ing because a shell-exported `ANTHROPIC_BASE_URL=https://api.anthropic.com` (missing `/v1`) was overriding the SDK default. `.env.local` now pins the correct base URL.

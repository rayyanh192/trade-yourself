# Future Ideas

A scratch file for product ideas that don't fit V0 but are worth not forgetting.
Add new ideas below as numbered sections. Don't filter too hard — capture the
raw idea first, sharpen later.

---

## 1. The Human Index

**The idea:** an index fund that uses everyone's data to create an average stock
price that fluctuates based on everyone's lives. Your personal stock chart, but
overlaid with a second line representing the aggregate of all users on the
platform. Like the S&P 500, but for human growth.

### Why it's interesting

- **Solves the "is 105 good?" problem.** A single user looking at their chart
  has no comparison. Is +5% in a month a lot or a little? The index gives the
  answer: outperform the index, you're growing faster than your peers; underperform,
  you're not, and that's information too.
- **Permission to feel okay during a hard month.** If the index drops in March,
  most users dropped in March. The hard month wasn't because you're broken —
  it was a market event. Reduces shame, increases connection. The aggregate
  becomes a kind of collective comfort.
- **First real virality mechanism.** The index ITSELF is a public artifact.
  Anyone can see how humanity is doing today, even non-users. "$HUMAN is up 4.2%
  this quarter" is a thing journalists would write about. Drives signups
  ("find out where you stand vs the market").
- **Validates the user's high bar isn't crazy.** Everyone's bar is the average
  bar. You'd be surprised how close you actually are.

### What it unlocks (UI ideas)

- **Second line on the dashboard chart.** User's own line in white,
  index in muted gray. Headline number changes from "+27% since IPO" to
  "+27% since IPO · +14% vs the index."
- **A public homepage widget.** `youinc.app/index` shows the live $HUMAN ticker
  to anyone, signed in or not. Low-commitment top-of-funnel.
- **Quarterly "State of the Human" report.** Aggregate version of the personal
  earnings letter. "Q3 2026 was a transitional quarter for humanity. The
  career sub-index expanded into the AI vertical with…"
- **Sub-indices for context.** By age cohort, by geography (opt-in), by
  category (the "career index" vs "relationships index"). "People in their 20s
  had a great September." Surfaces patterns you couldn't see alone.

### Open hard problems

- **Privacy is non-negotiable.** Individual entry text never leaves the user's
  account. Only aggregated daily score averages feed the index — no link from
  index movement back to specific entries.
- **Gaming.** If users know their data feeds the index, some will inflate
  scores. Need outlier rejection (e.g., scores >3σ from the user's own historical
  distribution get excluded from the aggregate). Also worth not advertising the
  feature too heavily — quiet aggregation feels less like a leaderboard to
  game.
- **Selection bias.** The "human index" is actually the "people-on-this-app
  index." Acknowledge this in the copy. Don't claim it's representative of
  humanity; claim it's representative of users. Honesty is the brand.
- **Existential weight.** What happens to the index on Sept 11 of any future
  year? When a country goes through collective trauma? The index will register
  it. Decide whether that's meaningful (the chart has gravity) or morbid (the
  chart cosplays grief). Lean toward meaningful — the value of the product is
  taking life seriously.
- **Performative inflation.** If users know they feed an index, do they bias
  toward inflated scoring? Mitigation: the LLM scores events, users don't
  pick scores directly. The bias has to go through "what events I choose
  to log" not "what scores I assign." Smaller surface, harder to game on
  purpose.

### Rough implementation sketch (V1+)

- Daily aggregation job: average of all users' daily price-change percentages
  → one row per day in `human_index(date, value, contributor_count)`.
- Anonymized at the aggregation layer; individual entries never touch this table.
- Outlier rejection happens before aggregation (per-user z-score filter).
- Expose at `/api/human-index?range=90d` for the public widget and the
  dashboard overlay.
- Add a `Human Index` line to `PriceChart.tsx` as a second category.

### Why this is V1+ and not V0

- Needs a userbase to be meaningful. An index of one is just your own line.
- Requires more careful privacy + outlier engineering than V0 has bandwidth for.
- The viral artifact (earnings letter) ships first; the index is the second
  viral artifact. Don't dilute V0 by competing with itself.

When the userbase hits ~100 active users with at least 30 days of entries each,
revisit. Until then, this stays here.

---

## (Add new ideas below)

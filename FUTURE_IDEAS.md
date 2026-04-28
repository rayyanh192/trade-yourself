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
- **Sub-indices for context.** By age cohort, by category (the "career index"
  vs "relationships index"), and especially:
  - **By major / field.** A CS index, EE index, mechE index, business index,
    arts index. Two specific unlocks: (a) when the AI hiring market dips, the
    CS index dips with it — users see they're not alone; (b) cross-field
    comparison ("EE outperformed CS this quarter — is the AI hiring slowdown
    real?"). Works as a recruiting / journalism hook on the public widget.
  - **By region.** A Silicon Valley index, NYC index, Lagos index, country-level
    indices. Reveals macro patterns in real time. When a major employer in a
    region does layoffs, the regional index registers it within days.
    Aggregation enforces ≥30 active users per slice before a sub-index goes
    public, otherwise it's de-anonymizing.
  - **By cohort start date.** "People who started youinc in March 2026."
    Lets you see how a peer group is doing without joining a smaller bucket.
  Sub-indices opt-in, not default. Users tag themselves at onboarding (V0.5+
  adds optional `major`, `region`, `industry` fields).

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

## 2. A native currency instead of USD

**The idea:** instead of denominating your personal stock in dollars
(`$127.43`), invent a unit specific to youinc. Your chart is no longer
priced in USD; it's priced in something that belongs to the product.

### Why it's interesting

- **Removes the money connotation.** Measuring your life in dollars is
  faintly mercantile. A custom unit reframes the chart as "growth units"
  rather than "self-worth in cash." More dignified, and arguably more
  honest about what's being measured.
- **Brand identity.** Roblox has Robux, Fortnite has V-Bucks, Reddit had
  karma. A native unit with a memorable name is a thing users say out loud
  ("I'm at 14k INKS") — that's a marketing surface no other journaling app has.
- **Doubles down on the metaphor.** A real public company has its share
  price in its native currency (NIO in CNY, Nvidia in USD, Toyota in JPY).
  You having your own unit makes the metaphor more committed, not less.
- **Decouples from the dollar's emotional baggage.** $100 starting feels
  arbitrary in dollar terms (why $100 and not $1?). A native unit can be
  anchored to something more meaningful — e.g., 1 unit = 1 day of being
  alive, or 1 unit = 1 logged event of magnitude small.

### Naming options to think through

Each carries a different vibe. None are right yet — pick during V1.5
brand work.

- **INKS** — "ink on the ledger." Small, modest, writerly. Pairs with the
  textbox metaphor.
- **MARKS** — "to mark a moment" callback. Callback to "Mark this day" on
  the onboarding submit button. Slight old-currency feel (Deutschmark).
- **TICKS** — stock ticker + time double-meaning. Compact, lowercase
  feels good. "I gained 47 ticks this week."
- **BEATS** — heartbeats. Life unit. Warmer than ticks.
- **SPANS** — lifespan. Slightly heavy.
- **CAPITA** — Latin for "head" (per-capita roots). Highbrow.
- **YOUI** — "you-i," the unit version of You, Inc. Self-referential.
  Can stylize as `Y` or `Ɏ`.

### What it changes in the product

- `users.baseline_price NUMERIC` becomes `users.baseline_units NUMERIC`,
  default 100.
- All UI changes from `$` prefix to the custom unit (suffix or symbol).
  Mockups: `127.43 INKS` or `Ɏ127.43`.
- The earnings letter prompt switches from "share price" to "unit value."
- Public ticker widget says `$HUMAN: 102.4 INKS · +2.4% today`.

### Open questions

- **One unit or per-user units?** Could each user mint their own ticker
  symbol AND their own currency name. Probably overkill; one product-wide
  unit is cleaner. But "personal currency" is a fun thought.
- **Is the unit conserved?** If someone gains 5 units, does someone else
  lose 5 (zero-sum, like a real market) or is growth additive across all
  users (positive-sum, what we have today with compounding)? Today's model
  is positive-sum and that's almost certainly right — but the choice should
  be conscious, not accidental.
- **Translation problem.** Most users will mentally translate `127 INKS`
  back into "is that a lot or a little?" — solved by the index from #1
  (relative to the human average) more than by the unit itself.

### Why this is V1.5+, not V0 or V1

- V0 ships with `$` because it's instantly readable to everyone. Every
  user sees their first chart and gets it. No glossary needed.
- V1 adds the human index (#1) — the comparison framing solves the "is
  this number good?" problem before the unit naming becomes urgent.
- V1.5+ rebrands to a native unit, ideally as a launch moment ("youinc is
  changing the way we measure ourselves"). The rebrand needs the
  userbase to be there; otherwise it's a tree falling in an empty forest.

---

## (Add new ideas below)

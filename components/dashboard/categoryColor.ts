// Maps the LLM's category enum to oklch border/text colors used on category tags.
// Keep in sync with lib/llm/score.ts ScoreSchema enum.

const PALETTE: Record<string, { color: string; border: string }> = {
    family: { color: 'oklch(0.82 0.10 30)', border: 'oklch(0.82 0.10 30 / 0.3)' },
    career: { color: 'oklch(0.78 0.10 230)', border: 'oklch(0.78 0.10 230 / 0.3)' },
    health: { color: 'oklch(0.80 0.12 145)', border: 'oklch(0.80 0.12 145 / 0.3)' },
    relationships: { color: 'oklch(0.80 0.10 290)', border: 'oklch(0.80 0.10 290 / 0.3)' },
    learning: { color: 'oklch(0.82 0.10 75)', border: 'oklch(0.82 0.10 75 / 0.3)' },
    creative: { color: 'oklch(0.80 0.13 320)', border: 'oklch(0.80 0.13 320 / 0.3)' },
    finance: { color: 'oklch(0.80 0.10 180)', border: 'oklch(0.80 0.10 180 / 0.3)' },
    lifestyle: { color: 'oklch(0.78 0.08 250)', border: 'oklch(0.78 0.08 250 / 0.3)' },
    mental_health: { color: 'oklch(0.80 0.10 200)', border: 'oklch(0.80 0.10 200 / 0.3)' },
    other: { color: 'var(--text-2)', border: 'var(--line-soft)' },
};

export function categoryColor(cat: string): { color: string; border: string } {
    return PALETTE[cat] ?? PALETTE.other;
}

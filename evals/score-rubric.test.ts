// LLM eval — runs each calibration event through scoreEntry and asserts the
// score is within ±2 of expected. Costs API credits per run (~$0.01 each with
// Sonnet, ~10 cents per full eval). Gated: not in default `bun run test`.
// Run with: bun run test:eval
//
// On failure: don't fix the test by tweaking expected_score. Fix the rubric in
// lib/llm/prompts.ts (and bump CURRENT_RUBRIC_VERSION + re-run the seed). The
// rubric IS the product.

import { describe, it, expect } from 'vitest';
import { scoreEntry } from '@/lib/llm/score';
import { CALIBRATION_EVENTS } from './calibration-events';

describe('rubric calibration', () => {
    for (const c of CALIBRATION_EVENTS) {
        it(
            `${c.label}: scores within ±2 of ${c.expected_score}`,
            async () => {
                const result = await scoreEntry(c.event_text);
                const delta = Math.abs(result.score - c.expected_score);
                expect(
                    delta,
                    `Got ${result.score} (reasoning: ${result.reasoning}), expected ${c.expected_score} ±2`,
                ).toBeLessThanOrEqual(2);
                if (c.expected_category) {
                    expect(result.category).toBe(c.expected_category);
                }
            },
            30_000,
        );
    }
});

// scoreEntry: the LLM call. Vercel AI SDK + Anthropic + Zod-typed output.
// Magnitude is NOT returned by the LLM (per the eng-review fix); it's
// computed server-side from |score| via magnitudeFromScore below. Single
// source of truth, no LLM/code drift.

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { SCORE_SYSTEM_MESSAGE, SCORE_USER_TEMPLATE, CURRENT_RUBRIC_VERSION } from './prompts';

// Schema sent to Anthropic. NOTE: Anthropic's structured output API does NOT
// support `minimum`/`maximum` on number types (will reject the request with
// "For 'number' type, properties maximum, minimum are not supported"). String
// length constraints are also dropped to match: we validate ranges after the
// LLM responds.
export const ScoreSchema = z.object({
    score: z.number(),
    category: z.enum([
        'career',
        'relationships',
        'health',
        'learning',
        'creative',
        'family',
        'finance',
        'lifestyle',
        'mental_health',
        'other',
    ]),
    reasoning: z.string(),
});

export type ScoreResult = z.infer<typeof ScoreSchema> & {
    magnitude: 'small' | 'medium' | 'large';
    rubric_version: number;
};

export async function scoreEntry(
    text: string,
    opts?: { baseline_assessment_text?: string | null },
): Promise<ScoreResult> {
    const { object } = await generateObject({
        model: anthropic('claude-haiku-4-5-20251001'),
        schema: ScoreSchema,
        system: SCORE_SYSTEM_MESSAGE,
        prompt: SCORE_USER_TEMPLATE(text, opts?.baseline_assessment_text ?? null),
        maxRetries: 2,
    });

    // Post-LLM validation. Per PLAN.md §7 error states: out-of-range = treat
    // like invalid output, do not save. Reasoning length is also bounded here.
    if (object.score < -10 || object.score > 10) {
        throw new Error(
            `LLM returned score ${object.score} outside [-10, 10]. Try rephrasing the entry or check the rubric.`,
        );
    }
    if (!object.reasoning || object.reasoning.length === 0) {
        throw new Error('LLM returned empty reasoning. Try again.');
    }

    return {
        ...object,
        magnitude: magnitudeFromScore(object.score),
        rubric_version: CURRENT_RUBRIC_VERSION,
    };
}

// Pure helper. Single source of truth for magnitude. Called by createEntry
// after scoreEntry returns, and exported for tests.
export function magnitudeFromScore(score: number): 'small' | 'medium' | 'large' {
    const abs = Math.abs(score);
    if (abs >= 7) return 'large';
    if (abs >= 3) return 'medium';
    return 'small';
}

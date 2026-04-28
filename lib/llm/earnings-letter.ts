// Quarterly earnings letter generation. CEO-speak summary of one quarter.
// Per PLAN.md §4 + §7.

import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export type LetterInput = {
    display_name: string;
    year: number;
    quarter: 1 | 2 | 3 | 4;
    percent_change: number;
    entries: Array<{
        created_at: string;
        text: string;
        score: number;
        category: string | null;
    }>;
};

const EARNINGS_LETTER_PROMPT = (input: LetterInput) =>
    `
You are the CEO of ${input.display_name} Inc. Write a one-paragraph quarterly shareholder letter summarizing the events of Q${input.quarter} ${input.year}, in formal CEO-speak.

Constraints:
- Be honest. Acknowledge dips and setbacks; do not paper over hard months.
- Reference at least 2 actual events from the quarter, framed in the corporate metaphor (e.g., "we expanded into the relationships vertical with…", "we faced headwinds from…").
- End with one forward-looking sentence about trajectory.
- 4-7 sentences. No bullet points.
- Tone: a real shareholder letter, not a horoscope. If the quarter was bad, say it was bad with corporate dignity.

Quarter performance: ${input.percent_change >= 0 ? '+' : ''}${input.percent_change.toFixed(2)}%

Events from this quarter (chronological):
${input.entries
        .map(
            (e) =>
                `- [${e.created_at.slice(0, 10)}] (${e.category ?? 'other'}, score ${e.score}) ${e.text}`,
        )
        .join('\n')}

Output: the letter as plain text. No greeting, no signoff, no quotation marks.
`.trim();

export async function generateLetter(input: LetterInput): Promise<string> {
    const { text } = await generateText({
        model: anthropic('claude-sonnet-4-5'),
        prompt: EARNINGS_LETTER_PROMPT(input),
        maxRetries: 2,
    });
    return text.trim();
}

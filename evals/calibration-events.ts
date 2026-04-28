// REPLACE THESE WITH YOUR OWN 10 EVENTS BEFORE TRUSTING THE EVAL.
//
// PLAN.md Step 1 (the offline assignment) says:
//   "Pick 10 real events from your past year. Mix of wins, losses, neutral.
//    Score each against the rubric. Show to a friend who knows you well; ask
//    them to score them with the same rubric. If their scores cluster within
//    ±2 of yours on at least 8 of 10, the rubric is good."
//
// The 10 events you (and ideally your friend) calibrated become the eval cases
// here. The eval test runs each event through scoreEntry and asserts the LLM's
// score is within ±2 of expected_score. Re-run any time you change the rubric
// in lib/llm/prompts.ts.
//
// The placeholder events below are SAMPLES — anonymized, generic. They'll let
// the eval pipeline work, but they're not YOUR rubric. Replace them.
//
// Run: bun run test:eval   (costs ~$0.10 with Sonnet; gated, doesn't run in CI)

export type CalibrationEvent = {
    label: string;            // short slug for test names
    event_text: string;       // what the user would type in the textbox
    expected_score: number;   // -10..+10
    expected_category?:       // optional secondary check
    'career' | 'relationships' | 'health' | 'learning' | 'creative'
    | 'family' | 'finance' | 'lifestyle' | 'mental_health' | 'other';
};

export const CALIBRATION_EVENTS: CalibrationEvent[] = [
    {
        label: 'major-career-win',
        event_text:
            'Got the senior role I have been working toward for two years. Director said I was the strongest candidate they have seen.',
        expected_score: 7,
        expected_category: 'career',
    },
    {
        label: 'small-routine-win',
        event_text: 'Worked out four times this week and noticed I have more energy.',
        expected_score: 2,
        expected_category: 'health',
    },
    {
        label: 'meaningful-relationship',
        event_text:
            'Had a hard conversation with my dad about his drinking. He listened. We both cried.',
        expected_score: 4,
        expected_category: 'family',
    },
    {
        label: 'neutral-day',
        event_text: 'Worked, ate dinner, watched a show, went to bed.',
        expected_score: 0,
        expected_category: 'lifestyle',
    },
    {
        label: 'small-setback',
        event_text: 'Got into a small argument with my partner about chores. Resolved by bedtime.',
        expected_score: -2,
        expected_category: 'relationships',
    },
    {
        label: 'meaningful-loss',
        event_text:
            'Got rejected from the grad program I was banking on. It was my top choice and I was sure I had it.',
        expected_score: -4,
        expected_category: 'learning',
    },
    {
        label: 'major-hit',
        event_text:
            'My partner of three years broke up with me. Said they had been thinking about it for months.',
        expected_score: -7,
        expected_category: 'relationships',
    },
    {
        label: 'creative-meaningful',
        event_text:
            'Finished the short story I have been working on for six months. Sent it to a friend who said it was the best thing I have written.',
        expected_score: 4,
        expected_category: 'creative',
    },
    {
        label: 'mental-health-step',
        event_text:
            'Booked my first therapy appointment after years of putting it off. Already feel relief just from booking it.',
        expected_score: 4,
        expected_category: 'mental_health',
    },
    {
        label: 'finance-small-win',
        event_text: 'Paid off the last of my credit card debt. $0 balance for the first time in years.',
        expected_score: 4,
        expected_category: 'finance',
    },
];

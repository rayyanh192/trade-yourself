// Shared types. Lives outside actions/ because 'use server' files can only
// export async functions — types and helpers must live elsewhere.

export type Entry = {
    id: string;
    user_id: string;
    text: string;
    created_at: string;
    score: number;
    magnitude: 'small' | 'medium' | 'large';
    category: string | null;
    llm_reasoning: string;
    rubric_version: number;
};

export type UserProfile = {
    id: string;
    email: string;
    display_name: string;
    ticker_symbol: string | null;
    ipo_date: string | null;
    baseline_price: number;
    baseline_assessment_text: string | null;
};

export type EarningsLetter = {
    id: string;
    year: number;
    quarter: 1 | 2 | 3 | 4;
    text: string;
    percent_change: number | null;
    events_used: number;
    generated_at: string;
};

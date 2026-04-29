'use server';

// Server actions for entries. Marked "use server" so they can be called from
// Client Components like a normal async function. Auth + RLS are handled by
// the server Supabase client — every query runs as the authenticated user.
//
// 'use server' files can ONLY export async functions. Types and helpers live
// in @/lib/types.ts.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { scoreEntry, magnitudeFromScore } from '@/lib/llm/score';
import { CURRENT_RUBRIC_VERSION } from '@/lib/llm/prompts';
import type { Entry } from '@/lib/types';

export type ScoredPreview = {
    score: number;
    category: string;
    reasoning: string;
    magnitude: 'small' | 'medium' | 'large';
    rubric_version: number;
};

export async function scoreEntryPreview(text: string): Promise<ScoredPreview> {
    const trimmed = text.trim();
    if (!trimmed) throw new Error('Entry text is empty.');
    if (trimmed.length > 2000) throw new Error('Entry text exceeds 2000 chars.');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('users')
        .select('baseline_assessment_text')
        .eq('id', user.id)
        .single();

    const scored = await scoreEntry(trimmed, {
        baseline_assessment_text: profile?.baseline_assessment_text ?? null,
    });

    return {
        score: scored.score,
        category: scored.category,
        reasoning: scored.reasoning,
        magnitude: scored.magnitude,
        rubric_version: scored.rubric_version,
    };
}

export async function commitScoredEntry(input: {
    text: string;
    score: number;
    category: string;
    reasoning: string;
    rubric_version: number;
}): Promise<Entry> {
    const trimmed = input.text.trim();
    if (!trimmed) throw new Error('Entry text is empty.');
    if (trimmed.length > 2000) throw new Error('Entry text exceeds 2000 chars.');
    if (input.score < -10 || input.score > 10) throw new Error('Score out of range.');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: inserted, error: insertErr } = await supabase
        .from('entries')
        .insert({
            user_id: user.id,
            text: trimmed,
            score: input.score,
            magnitude: magnitudeFromScore(input.score),
            category: input.category,
            llm_reasoning: input.reasoning,
            rubric_version: input.rubric_version || CURRENT_RUBRIC_VERSION,
        })
        .select('*')
        .single();

    if (insertErr) throw new Error(`Insert failed: ${insertErr.message}`);

    revalidatePath('/dashboard');
    revalidatePath('/');
    return inserted as Entry;
}

export async function createEntry(text: string): Promise<Entry> {
    const trimmed = text.trim();
    if (!trimmed) throw new Error('Entry text is empty.');
    if (trimmed.length > 2000) throw new Error('Entry text exceeds 2000 chars.');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Read the user's profile (we need baseline_assessment_text for scoring context).
    const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('ipo_date, baseline_assessment_text')
        .eq('id', user.id)
        .single();

    if (profileErr) throw new Error(`Could not read profile: ${profileErr.message}`);
    if (!profile?.ipo_date) throw new Error('OnboardingRequired');

    // Score via LLM. Errors propagate; the caller preserves textbox state.
    const scored = await scoreEntry(trimmed, {
        baseline_assessment_text: profile?.baseline_assessment_text ?? null,
    });

    const { data: inserted, error: insertErr } = await supabase
        .from('entries')
        .insert({
            user_id: user.id,
            text: trimmed,
            score: scored.score,
            magnitude: scored.magnitude,
            category: scored.category,
            llm_reasoning: scored.reasoning,
            rubric_version: scored.rubric_version,
        })
        .select('*')
        .single();

    if (insertErr) throw new Error(`Insert failed: ${insertErr.message}`);

    revalidatePath('/dashboard');
    revalidatePath('/');
    return inserted as Entry;
}

export async function getEntries(): Promise<Entry[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    if (error) throw new Error(`getEntries failed: ${error.message}`);
    return (data ?? []) as Entry[];
}

export async function getEntry(id: string): Promise<Entry | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // No rows
        throw new Error(`getEntry failed: ${error.message}`);
    }
    return data as Entry;
}

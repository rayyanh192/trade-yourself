'use server';

// User profile actions. setIPODate is the onboarding write — sets the date
// and 3-sentence baseline. Validates the date isn't in the future and the
// text isn't trivially short.
//
// 'use server' files can ONLY export async functions. Types live in
// @/lib/types.ts.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { UserProfile } from '@/lib/types';

export async function getCurrentUser(): Promise<UserProfile | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('users')
        .select('id, email, display_name, ticker_symbol, ipo_date, baseline_price, baseline_assessment_text')
        .eq('id', user.id)
        .single();

    if (error) throw new Error(`getCurrentUser failed: ${error.message}`);
    return data as UserProfile;
}

export async function setIPODate(input: {
    ipo_date: string;                 // YYYY-MM-DD
    baseline_assessment_text: string;
    display_name?: string;
    ticker_symbol?: string;
}): Promise<void> {
    // Validate
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRe.test(input.ipo_date)) throw new Error('IPO date must be YYYY-MM-DD.');

    const ipo = new Date(input.ipo_date + 'T00:00:00Z');
    if (Number.isNaN(ipo.getTime())) throw new Error('IPO date is invalid.');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (ipo.getTime() > today.getTime()) {
        throw new Error('IPO date must be in the past — your IPO already happened.');
    }

    const MIN_BASELINE_LEN = 20;
    const MAX_BASELINE_LEN = 2000;
    const text = input.baseline_assessment_text.trim();
    if (text.length < MIN_BASELINE_LEN) {
        throw new Error('Write at least 20 characters. The LLM uses this to anchor your early scores.');
    }
    if (text.length > MAX_BASELINE_LEN) {
        throw new Error(`Baseline text exceeds ${MAX_BASELINE_LEN} chars.`);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // COALESCE-style update: only overwrite display_name / ticker_symbol if provided.
    const update: Record<string, unknown> = {
        ipo_date: input.ipo_date,
        baseline_assessment_text: text,
    };
    if (input.display_name?.trim()) update.display_name = input.display_name.trim();
    if (input.ticker_symbol?.trim()) update.ticker_symbol = input.ticker_symbol.trim().toUpperCase();

    const { error } = await supabase
        .from('users')
        .update(update)
        .eq('id', user.id);

    if (error) throw new Error(`setIPODate failed: ${error.message}`);

    revalidatePath('/dashboard');
    revalidatePath('/');
    revalidatePath('/onboarding');
}

'use server';

// Earnings letter actions. Idempotent: getQuarterlyLetter returns the cached
// letter if one exists, generateQuarterlyLetter creates and persists one.
//
// 'use server' files can ONLY export async functions. Types live in
// @/lib/types.ts; quarter-math helpers in @/lib/quarter.ts.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { generateLetter } from '@/lib/llm/earnings-letter';
import { quarterRange } from '@/lib/quarter';
import type { EarningsLetter } from '@/lib/types';

export async function getQuarterlyLetter(input: {
    year: number;
    quarter: 1 | 2 | 3 | 4;
}): Promise<EarningsLetter | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data, error } = await supabase
        .from('earnings_letters')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', input.year)
        .eq('quarter', input.quarter)
        .maybeSingle();

    if (error) throw new Error(`getQuarterlyLetter failed: ${error.message}`);
    return data as EarningsLetter | null;
}

export async function generateQuarterlyLetter(input: {
    year: number;
    quarter: 1 | 2 | 3 | 4;
}): Promise<EarningsLetter> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Idempotent — return cached if exists.
    const cached = await getQuarterlyLetter(input);
    if (cached) return cached;

    // Read profile (display_name, baseline_price)
    const { data: profile, error: pErr } = await supabase
        .from('users')
        .select('display_name, baseline_price')
        .eq('id', user.id)
        .single();
    if (pErr || !profile) throw new Error('Could not read profile.');

    // Read entries for this quarter
    const { start, end } = quarterRange(input.year, input.quarter);
    const { data: entries, error: eErr } = await supabase
        .from('entries')
        .select('created_at, text, score, category')
        .eq('user_id', user.id)
        .gte('created_at', start)
        .lt('created_at', end)
        .order('created_at', { ascending: true });
    if (eErr) throw new Error(`Could not read entries: ${eErr.message}`);
    if (!entries || entries.length === 0) throw new Error('No entries in that quarter — log something first.');

    // Compute the quarter's percent change. Approximate: entries-only compounding,
    // ignoring entries before the quarter (so the % is "during this quarter").
    const quarterReturn =
        entries.reduce((acc, e) => acc * (1 + Number(e.score) / 100), 1) - 1;
    const percentChange = quarterReturn * 100;

    const letterText = await generateLetter({
        display_name: profile.display_name,
        year: input.year,
        quarter: input.quarter,
        percent_change: percentChange,
        entries: entries.map((e) => ({
            created_at: e.created_at,
            text: e.text,
            score: Number(e.score),
            category: e.category,
        })),
    });

    const { data: inserted, error: iErr } = await supabase
        .from('earnings_letters')
        .insert({
            user_id: user.id,
            year: input.year,
            quarter: input.quarter,
            text: letterText,
            percent_change: percentChange,
            events_used: entries.length,
        })
        .select('*')
        .single();
    if (iErr) throw new Error(`Letter insert failed: ${iErr.message}`);

    revalidatePath('/dashboard');
    return inserted as EarningsLetter;
}

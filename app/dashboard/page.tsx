// V1 dashboard — Claude Design handoff (2026-04-29). All visuals + interactions
// live in <Dashboard /> client component. This server page only does the auth
// gate, profile/entries fetch, and onboarding redirect.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEntries } from '@/actions/entries';
import { Dashboard } from '@/components/dashboard/Dashboard';

export default async function DashboardPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('users')
        .select('display_name, ticker_symbol, ipo_date, baseline_price')
        .eq('id', user.id)
        .single();

    if (!profile?.ipo_date) redirect('/onboarding');

    const entries = await getEntries();

    return (
        <Dashboard
            initialEntries={entries}
            profile={{
                display_name: profile.display_name,
                ticker_symbol: profile.ticker_symbol,
                ipo_date: profile.ipo_date,
                baseline_price: Number(profile.baseline_price ?? 100),
            }}
            userEmail={user.email ?? ''}
        />
    );
}

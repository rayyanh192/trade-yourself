// Home is now a redirect router. Single source for "where should I land?"
// Step 6 will add the onboarding gate (no ipo_date → /onboarding).

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Read profile to decide where to send them.
    const { data: profile } = await supabase
        .from('users')
        .select('ipo_date')
        .eq('id', user.id)
        .single();

    if (!profile?.ipo_date) redirect('/onboarding');
    redirect('/dashboard');
}

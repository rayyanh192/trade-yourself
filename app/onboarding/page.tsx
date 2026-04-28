// IPO baseline onboarding. Shown ONCE per user — if ipo_date is already set,
// redirect straight to /dashboard. Per PLAN.md §6.5.1.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BaselineForm } from '@/components/BaselineForm';

export default async function OnboardingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('users')
        .select('ipo_date')
        .eq('id', user.id)
        .single();

    if (profile?.ipo_date) redirect('/dashboard');

    return (
        <main className="min-h-screen bg-black text-neutral-200 flex items-center justify-center p-6">
            <div className="w-full max-w-xl">

                <p className="text-xs uppercase tracking-widest text-neutral-600 mb-6">
                    One quick thing
                </p>

                <h1 className="text-4xl font-medium mb-4 text-neutral-100">
                    Pick the day you went public.
                </h1>

                <p className="text-neutral-400 text-base mb-10 leading-relaxed">
                    Choose a date that means something to you. It becomes the version of yourself
                    everything else is measured against.
                </p>

                <BaselineForm />
            </div>
        </main>
    );
}

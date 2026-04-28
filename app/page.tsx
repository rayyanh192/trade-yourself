// V0 home. Step 3 acceptance: signed-in user lands here and sees their email +
// the row from public.users (proves the auth trigger fired). Signed-out user
// gets redirected to /login.
//
// In Step 6 (IPO baseline onboarding) this page will start redirecting to
// /onboarding when ipo_date is null and to /dashboard when it is set. For now
// it just confirms auth works.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SignOutButton } from './sign-out-button';

export default async function Home() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Read the public.users row that the auth trigger created on signup.
    const { data: profile } = await supabase
        .from('users')
        .select('id, email, display_name, ticker_symbol, ipo_date, baseline_price')
        .eq('id', user.id)
        .single();

    return (
        <main className="min-h-screen bg-black text-neutral-200 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <h1 className="text-3xl font-medium mb-1">Signed in.</h1>
                <p className="text-neutral-400 text-sm mb-8">
                    Auth works. The trigger created your <code className="text-neutral-300">public.users</code> row.
                </p>

                <div className="border border-neutral-800 rounded p-4 bg-neutral-950 text-sm">
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                        <dt className="text-neutral-500">auth.user.id</dt>
                        <dd className="text-neutral-300 font-mono text-xs break-all">{user.id}</dd>

                        <dt className="text-neutral-500">email</dt>
                        <dd className="text-neutral-300">{user.email}</dd>

                        <dt className="text-neutral-500">display_name</dt>
                        <dd className="text-neutral-300">{profile?.display_name ?? '—'}</dd>

                        <dt className="text-neutral-500">baseline_price</dt>
                        <dd className="text-neutral-300">${profile?.baseline_price ?? '—'}</dd>

                        <dt className="text-neutral-500">ipo_date</dt>
                        <dd className="text-neutral-300">{profile?.ipo_date ?? '(not onboarded yet)'}</dd>
                    </dl>
                </div>

                <div className="mt-6">
                    <SignOutButton />
                </div>
            </div>
        </main>
    );
}

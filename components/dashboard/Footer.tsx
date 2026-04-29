'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function Footer({ email }: { email: string }) {
    const router = useRouter();
    const [pending, setPending] = useState(false);

    async function handleSignOut() {
        setPending(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    }

    return (
        <div
            className="flex justify-between items-center flex-wrap gap-3 border-t font-mono mt-auto"
            style={{
                padding: '24px 40px',
                borderColor: 'var(--line-soft)',
                fontSize: 11,
                letterSpacing: '0.04em',
                color: 'var(--text-3)',
            }}
        >
            <div>© 2026 youinc · all rights reserved to you</div>
            <div className="flex gap-5 items-center">
                <span style={{ color: 'var(--text-1)' }}>{email}</span>
                <span style={{ color: 'var(--text-3)' }}>·</span>
                <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={pending}
                    className="transition-colors hover:text-[var(--text-0)]"
                    style={{ color: 'var(--text-1)', background: 'none', border: 'none' }}
                >
                    {pending ? 'signing out…' : 'sign out'}
                </button>
            </div>
        </div>
    );
}

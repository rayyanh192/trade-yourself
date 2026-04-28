'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SignOutButton() {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    async function handleSignOut() {
        setIsPending(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    }

    return (
        <button
            onClick={handleSignOut}
            disabled={isPending}
            className="text-neutral-400 hover:text-neutral-200 text-sm underline disabled:opacity-50"
        >
            {isPending ? 'Signing out...' : 'Sign out'}
        </button>
    );
}

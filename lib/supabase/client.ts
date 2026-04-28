// Browser-side Supabase client. Used in Client Components ("use client").
// Reads the anon key, which is safe to expose. Row Level Security in the
// database enforces who can see what.

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
}

// Server-side Supabase client. Used in Server Components, server actions,
// route handlers, and middleware. Reads the anon key but binds the user's
// session via cookies, so Row Level Security still applies as that user.
// Never uses the service-role key — that lives only in supabase/seed.ts.

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options),
                        );
                    } catch {
                        // Server Components can't set cookies; middleware handles refresh.
                        // Safe to swallow — the session refresh happens in middleware.ts.
                    }
                },
            },
        },
    );
}

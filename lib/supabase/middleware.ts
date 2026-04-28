// Refreshes the Supabase session on every request that hits middleware.
// Without this, sessions silently expire after ~1 hour and users get logged out
// even if they're actively using the app. The pattern is straight from
// Supabase's official Next.js SSR guide.

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value),
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options),
                    );
                },
            },
        },
    );

    // IMPORTANT: getUser() must be called between createServerClient and the
    // returned response. It's what triggers the cookie refresh.
    await supabase.auth.getUser();

    return supabaseResponse;
}

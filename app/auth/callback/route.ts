// Magic-link callback. The user clicks the link in their email; the link points
// here with `?code=...`. We exchange the code for a session, set the cookie via
// the server Supabase client, then redirect to /.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Code missing or exchange failed: bounce back to login with a flag.
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

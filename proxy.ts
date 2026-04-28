// Next.js 16 proxy (formerly middleware). Runs on every request matching the
// `matcher` config below. All it does is delegate to lib/supabase/middleware.ts
// so the auth session stays fresh.
//
// Renamed from middleware.ts to proxy.ts in Next.js 16 — the framework only
// recognizes the `proxy` export now. Keep the helper file's name as-is; it's
// our own helper, not framework-recognized.

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
    return await updateSession(request);
}

export const config = {
    // Match every request EXCEPT static assets and the favicon. Auth callback
    // is included because we want session cookies set immediately after that
    // route runs.
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
};

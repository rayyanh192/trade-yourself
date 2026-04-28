// One-time seed: writes rubric_versions row v1 by reading from lib/llm/prompts.ts.
// This is the canonical "single source of truth" for the rubric — run this
// after the migration and any time CURRENT_RUBRIC_VERSION changes.
//
// Run with:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bun run supabase/seed.ts
//
// The service-role key bypasses RLS — you NEED it for inserts to public.rubric_versions
// (the table has no insert policy). Do NOT put SERVICE_ROLE_KEY in .env.local
// without prefixing it for clarity; it leaks to the client at build time if you
// ever accidentally use NEXT_PUBLIC_*. Pass it inline on the command line or
// store in your shell rc.

import { createClient } from '@supabase/supabase-js';
import { SCORE_SYSTEM_MESSAGE, CURRENT_RUBRIC_VERSION } from '../lib/llm/prompts';

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
    console.error('ERROR: SUPABASE_URL not set (or NEXT_PUBLIC_SUPABASE_URL).');
    process.exit(1);
}
if (!key) {
    console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not set.');
    console.error('Get it from your Supabase dashboard: Project Settings -> API -> service_role key.');
    console.error('Run with: SUPABASE_SERVICE_ROLE_KEY=... bun run supabase/seed.ts');
    process.exit(1);
}

const supabase = createClient(url, key);

const { error } = await supabase.from('rubric_versions').upsert(
    {
        version: CURRENT_RUBRIC_VERSION,
        rubric_text: SCORE_SYSTEM_MESSAGE,
        anchor_examples_json: [],
        notes: `v${CURRENT_RUBRIC_VERSION}: synced from lib/llm/prompts.ts at ${new Date().toISOString()}`,
    },
    { onConflict: 'version' },
);

if (error) {
    console.error('Seed failed:', error);
    process.exit(1);
}
console.log(`Seeded rubric version ${CURRENT_RUBRIC_VERSION}.`);

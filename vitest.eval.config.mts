// Separate vitest config for the LLM eval suite. Lives behind `bun run test:eval`
// so the default `bun run test` (and CI) never burns API credits.

import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(__dirname),
        },
    },
    test: {
        environment: 'node',
        include: ['evals/**/*.test.ts'],
        // Loads .env.local so ANTHROPIC_API_KEY is available without manual export.
        env: loadDotEnvLocal(),
        testTimeout: 60_000,
    },
});

function loadDotEnvLocal(): Record<string, string> {
    try {
        const fs = require('node:fs');
        const text = fs.readFileSync(resolve(__dirname, '.env.local'), 'utf8');
        const out: Record<string, string> = {};
        for (const line of text.split('\n')) {
            const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
            if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
        return out;
    } catch {
        return {};
    }
}

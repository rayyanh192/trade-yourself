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
        // Default scope: unit tests only. Eval tests (LLM-calling) are gated
        // behind `bun run test:eval` so CI doesn't burn API credits.
        include: ['lib/**/*.test.ts', 'lib/**/*.test.tsx'],
    },
});

'use client';

// Manual button to generate the current quarter's earnings letter. Disabled
// if the current quarter has 0 entries. Caches via the unique constraint on
// (user_id, year, quarter); subsequent clicks return the cached letter.

import { useState } from 'react';
import { generateQuarterlyLetter } from '@/actions/earnings';
import { currentQuarter } from '@/lib/quarter';
import type { EarningsLetter } from '@/lib/types';

type Props = {
    hasCurrentQuarterEntries: boolean;
};

export function EarningsLetterButton({ hasCurrentQuarterEntries }: Props) {
    const [letter, setLetter] = useState<EarningsLetter | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    async function handleClick() {
        setStatus('loading');
        setError(null);
        try {
            const { year, quarter } = currentQuarter();
            const result = await generateQuarterlyLetter({ year, quarter });
            setLetter(result);
            setStatus('idle');
        } catch (err) {
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    }

    if (!hasCurrentQuarterEntries) {
        return (
            <p className="text-xs text-neutral-600">
                Letters appear at the end of each quarter — log entries first.
            </p>
        );
    }

    const { quarter, year } = currentQuarter();

    return (
        <>
            <button
                onClick={handleClick}
                disabled={status === 'loading'}
                className="text-sm text-neutral-400 hover:text-neutral-200 underline disabled:opacity-50"
            >
                {status === 'loading'
                    ? 'Generating Q' + quarter + ' letter...'
                    : letter
                        ? 'View Q' + quarter + ' ' + year + ' letter →'
                        : 'Generate Q' + quarter + ' ' + year + ' letter →'}
            </button>

            {error && (
                <p className="text-xs text-rose-400 mt-2">{error}</p>
            )}

            {letter && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
                    onClick={() => setLetter(null)}
                >
                    <div
                        className="bg-neutral-950 border border-neutral-800 rounded-lg max-w-2xl w-full p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="text-xs uppercase tracking-widest text-neutral-600 mb-2">
                            Quarterly Shareholder Letter
                        </p>
                        <p className="text-lg text-neutral-200 mb-1">
                            Q{letter.quarter} {letter.year}
                        </p>
                        <p className={`font-mono text-sm mb-6 ${(letter.percent_change ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {(letter.percent_change ?? 0) >= 0 ? '+' : ''}
                            {(letter.percent_change ?? 0).toFixed(2)}% · {letter.events_used} events
                        </p>

                        <p className="text-neutral-200 text-base leading-relaxed whitespace-pre-wrap">
                            {letter.text}
                        </p>

                        <button
                            onClick={() => setLetter(null)}
                            className="mt-6 text-xs text-neutral-500 hover:text-neutral-300 underline"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

'use client';

// Onboarding form. Date picker + 3-sentence textarea. Per PLAN.md §6.5.1.
// Calls setIPODate then redirects to /dashboard.

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { setIPODate } from '@/actions/user';

const MIN_LEN = 20;
const MAX_LEN = 600;

export function BaselineForm() {
    const router = useRouter();
    const [ipoDate, setDate] = useState('');
    const [text, setText] = useState('');
    const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const today = new Date().toISOString().slice(0, 10);
    const trimmed = text.trim();
    const tooShort = trimmed.length > 0 && trimmed.length < MIN_LEN;
    const tooLong = trimmed.length > MAX_LEN;
    const canSubmit = !!ipoDate && trimmed.length >= MIN_LEN && trimmed.length <= MAX_LEN;

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!canSubmit) return;
        setStatus('saving');
        setError(null);
        try {
            await setIPODate({ ipo_date: ipoDate, baseline_assessment_text: trimmed });
            router.push('/dashboard');
            router.refresh();
        } catch (err) {
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
                <label className="block text-sm text-neutral-400 mb-2">
                    Pick your IPO date
                </label>
                <input
                    type="date"
                    value={ipoDate}
                    onChange={(e) => setDate(e.target.value)}
                    max={today}
                    required
                    disabled={status === 'saving'}
                    className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5
                               text-base text-neutral-200
                               focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600
                               disabled:opacity-50"
                />
            </div>

            <div>
                <label className="block text-sm text-neutral-400 mb-2">
                    In three sentences, who were you on that day?
                </label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Where were you living? What were you doing? What were you afraid of?"
                    rows={5}
                    required
                    disabled={status === 'saving'}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5
                               text-base text-neutral-200 placeholder:text-neutral-500
                               focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600
                               disabled:opacity-50 resize-none"
                />
                <div className="flex justify-between items-center mt-1.5 text-xs">
                    <span className={tooShort ? 'text-rose-400' : 'text-neutral-500'}>
                        {tooShort
                            ? `${MIN_LEN - trimmed.length} more characters`
                            : 'Minimum 20 characters'}
                    </span>
                    <span className={tooLong ? 'text-rose-400' : 'text-neutral-500'}>
                        {trimmed.length}/{MAX_LEN}
                    </span>
                </div>
            </div>

            <button
                type="submit"
                disabled={!canSubmit || status === 'saving'}
                className="bg-neutral-100 text-black rounded px-4 py-2.5 text-base font-medium
                           hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed
                           transition-colors self-start"
            >
                {status === 'saving' ? 'Saving...' : 'Mark this day'}
            </button>

            {error && (
                <p className="text-rose-400 text-sm">{error}</p>
            )}
        </form>
    );
}

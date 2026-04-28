'use client';

// The "what happened today?" textbox. Calls createEntry on submit.
// Cmd+Enter / Ctrl+Enter submits (per design system Section 0).
// Preserves text on error so the user doesn't lose what they wrote.

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createEntry } from '@/actions/entries';

const MAX_LENGTH = 2000;

export function EntryTextbox() {
    const router = useRouter();
    const [text, setText] = useState('');
    const [status, setStatus] = useState<'idle' | 'scoring' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e?: FormEvent<HTMLFormElement>) {
        e?.preventDefault();
        const trimmed = text.trim();
        if (!trimmed) return;
        if (trimmed.length > MAX_LENGTH) return;

        setStatus('scoring');
        setError(null);
        try {
            await createEntry(trimmed);
            setText('');
            setStatus('idle');
            router.refresh();
        } catch (err) {
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Unknown error');
            // Preserve text — don't clear it.
        }
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        const isCmdEnter = (e.metaKey || e.ctrlKey) && e.key === 'Enter';
        if (isCmdEnter) {
            e.preventDefault();
            void handleSubmit();
        }
    }

    const overLimit = text.length > MAX_LENGTH;
    const disabled = status === 'scoring' || !text.trim() || overLimit;

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What happened today?"
                disabled={status === 'scoring'}
                rows={3}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5
                           text-base text-neutral-200 placeholder:text-neutral-500
                           focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600
                           disabled:opacity-50 resize-none"
            />
            <div className="flex justify-between items-center mt-2 text-xs text-neutral-500">
                <span>
                    {status === 'scoring'
                        ? 'Scoring...'
                        : status === 'error'
                            ? <span className="text-rose-400">{error}</span>
                            : 'Cmd+Enter to submit'}
                </span>
                <div className="flex items-center gap-3">
                    <span className={overLimit ? 'text-rose-400' : ''}>
                        {text.length}/{MAX_LENGTH}
                    </span>
                    <button
                        type="submit"
                        disabled={disabled}
                        className="bg-neutral-100 text-black rounded px-3 py-1.5 text-xs font-medium
                                   hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed
                                   transition-colors"
                    >
                        Submit
                    </button>
                </div>
            </div>
        </form>
    );
}

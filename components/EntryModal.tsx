'use client';

// Modal that opens when a chart point is clicked. Fetches the full entry on
// open and displays text + score + reasoning. Click-outside or Esc to close.

import { useEffect, useState } from 'react';
import { getEntry } from '@/actions/entries';
import type { Entry } from '@/lib/types';

type Props = {
    entryId: string | null;
    onClose: () => void;
};

export function EntryModal({ entryId, onClose }: Props) {
    const [entry, setEntry] = useState<Entry | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!entryId) {
            setEntry(null);
            return;
        }
        let cancelled = false;
        setLoading(true);
        getEntry(entryId)
            .then((e) => {
                if (!cancelled) {
                    setEntry(e);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setEntry(null);
                    setLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [entryId]);

    useEffect(() => {
        if (!entryId) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [entryId, onClose]);

    if (!entryId) return null;

    const score = entry ? Number(entry.score) : 0;
    const scoreColor = score > 0 ? 'text-emerald-400' : score < 0 ? 'text-rose-400' : 'text-neutral-400';

    return (
        <div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-neutral-950 border border-neutral-800 rounded-lg max-w-lg w-full p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {loading && (
                    <p className="text-neutral-500 text-sm">Loading...</p>
                )}

                {!loading && !entry && (
                    <>
                        <p className="text-neutral-300">Couldn't load that entry.</p>
                        <button
                            onClick={onClose}
                            className="mt-4 text-xs text-neutral-500 underline"
                        >
                            Close
                        </button>
                    </>
                )}

                {!loading && entry && (
                    <>
                        <div className="flex justify-between items-baseline mb-3">
                            <span className="text-xs font-mono text-neutral-500">
                                {new Date(entry.created_at).toLocaleString()}
                            </span>
                            <span className={`font-mono text-base ${scoreColor}`}>
                                {score > 0 ? '+' : ''}{score.toFixed(1)}
                                <span className="text-neutral-500 text-xs ml-2">
                                    {entry.category} · {entry.magnitude}
                                </span>
                            </span>
                        </div>

                        <p className="text-neutral-200 text-base whitespace-pre-wrap mb-4">
                            {entry.text}
                        </p>

                        <p className="text-neutral-500 text-sm italic border-t border-neutral-900 pt-3">
                            {entry.llm_reasoning}
                        </p>

                        <div className="flex justify-between items-center mt-5 text-xs text-neutral-600">
                            <span className="font-mono">rubric v{entry.rubric_version}</span>
                            <button
                                onClick={onClose}
                                className="text-neutral-500 hover:text-neutral-300 underline"
                            >
                                Close (Esc)
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

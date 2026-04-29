'use client';

import { currentQuarter } from '@/lib/quarter';
import type { Entry } from '@/lib/types';
import { Btn } from './EntryBox';

export function EarningsCard({
    entries,
    onGenerate,
}: {
    entries: Entry[];
    onGenerate: () => void;
}) {
    const cq = currentQuarter();
    const startMonth = (cq.quarter - 1) * 3;
    const start = new Date(Date.UTC(cq.year, startMonth, 1)).toISOString();
    const end = new Date(Date.UTC(cq.year, startMonth + 3, 1)).toISOString();
    const qEntries = entries.filter((e) => e.created_at >= start && e.created_at < end);
    const label = `Q${cq.quarter} ${cq.year}`;

    return (
        <div
            className="rounded-md border flex justify-between items-center gap-6 flex-wrap"
            style={{
                background: 'var(--bg-1)',
                borderColor: 'var(--line-soft)',
                padding: '22px 24px',
            }}
        >
            <div>
                <div
                    className="font-mono uppercase"
                    style={{
                        fontSize: 10,
                        letterSpacing: '0.1em',
                        color: 'var(--text-3)',
                        marginBottom: 6,
                    }}
                >
                    Shareholder communications
                </div>
                <h3
                    style={{
                        margin: '0 0 4px',
                        fontFamily: 'var(--font-source-serif), Georgia, serif',
                        fontSize: 22,
                        fontWeight: 500,
                        color: 'var(--text-0)',
                        letterSpacing: '-0.01em',
                    }}
                >
                    Generate {label} earnings letter
                </h3>
                <p
                    style={{
                        margin: 0,
                        color: 'var(--text-2)',
                        fontSize: 13,
                        maxWidth: '50ch',
                    }}
                >
                    A short, honest letter from you to you — synthesized from {qEntries.length}{' '}
                    entries this quarter. Share it, save it, or burn it.
                </p>
            </div>
            <Btn variant="amber" onClick={onGenerate} disabled={qEntries.length === 0}>
                Generate letter
            </Btn>
        </div>
    );
}

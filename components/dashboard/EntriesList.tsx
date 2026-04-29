'use client';

import type { Entry } from '@/lib/types';
import { Tag } from './EntryBox';

export function EntriesList({
    entries,
    hoveredId,
    onHover,
}: {
    entries: Entry[];
    hoveredId: string | null;
    onHover: (id: string | null) => void;
}) {
    const recent = [...entries]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

    return (
        <section>
            <div
                className="flex justify-between items-center font-mono uppercase mb-3"
                style={{
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    color: 'var(--text-2)',
                }}
            >
                <span>recent entries · last {recent.length}</span>
                <span style={{ color: 'var(--text-3)' }}>hover to highlight on chart</span>
            </div>
            <div className="flex flex-col">
                {recent.length === 0 && (
                    <div
                        className="font-mono text-center border-t"
                        style={{
                            padding: '24px 0',
                            fontSize: 12,
                            color: 'var(--text-3)',
                            borderColor: 'var(--line-soft)',
                        }}
                    >
                        Write your first entry above. The chart will start tracking from today.
                    </div>
                )}
                {recent.map((e) => {
                    const score = Number(e.score);
                    const isGain = score >= 0;
                    const d = new Date(e.created_at);
                    const highlighted = hoveredId === e.id;
                    return (
                        <div
                            key={e.id}
                            onMouseEnter={() => onHover(e.id)}
                            onMouseLeave={() => onHover(null)}
                            className="grid items-start cursor-pointer transition-colors border-t relative"
                            style={{
                                gridTemplateColumns: '110px 56px 1fr',
                                gap: 16,
                                padding: '16px 0',
                                borderColor: 'var(--line-soft)',
                                background: highlighted ? 'var(--bg-1)' : 'transparent',
                            }}
                        >
                            <div
                                className="font-mono"
                                style={{
                                    fontSize: 11,
                                    color: 'var(--text-2)',
                                    letterSpacing: '0.04em',
                                    lineHeight: 1.6,
                                }}
                            >
                                <span style={{ color: 'var(--text-1)', display: 'block' }}>
                                    {d.toLocaleDateString('en', {
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </span>
                                <span style={{ color: 'var(--text-3)' }}>
                                    {d.toLocaleString('en', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                            <div
                                className="font-mono text-right"
                                style={{
                                    fontSize: 20,
                                    fontWeight: 600,
                                    fontVariantNumeric: 'tabular-nums',
                                    lineHeight: 1.1,
                                    color: isGain ? 'var(--gain)' : 'var(--loss)',
                                }}
                            >
                                {isGain ? '+' : ''}
                                {score.toFixed(1)}
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                    {e.category && <Tag category={e.category}>{e.category}</Tag>}
                                    <Tag>{e.magnitude}</Tag>
                                </div>
                                <div
                                    style={{
                                        color: 'var(--text-0)',
                                        fontSize: 14,
                                        lineHeight: 1.5,
                                        marginBottom: 6,
                                        whiteSpace: 'pre-wrap',
                                    }}
                                >
                                    {e.text}
                                </div>
                                {e.llm_reasoning && (
                                    <div
                                        className="italic"
                                        style={{
                                            fontFamily:
                                                'var(--font-source-serif), Georgia, serif',
                                            color: 'var(--text-1)',
                                            fontSize: 13,
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        &ldquo;{e.llm_reasoning}&rdquo;
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

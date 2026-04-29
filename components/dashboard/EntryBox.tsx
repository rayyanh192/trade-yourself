'use client';

import { useState, useRef, type CSSProperties, type KeyboardEvent } from 'react';
import { scoreEntryPreview, commitScoredEntry, type ScoredPreview } from '@/actions/entries';
import type { Entry } from '@/lib/types';
import { fmtToday } from './format';
import { categoryColor } from './categoryColor';

const MAX_LENGTH = 2000;

type Phase = 'idle' | 'scoring' | 'result';

export function EntryBox({ onCommitted }: { onCommitted: (e: Entry) => void }) {
    const [text, setText] = useState('');
    const [phase, setPhase] = useState<Phase>('idle');
    const [result, setResult] = useState<ScoredPreview | null>(null);
    const [step, setStep] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [committing, setCommitting] = useState(false);
    const taRef = useRef<HTMLTextAreaElement>(null);

    async function submit() {
        const trimmed = text.trim();
        if (!trimmed || phase !== 'idle') return;
        if (trimmed.length > MAX_LENGTH) return;

        setError(null);
        setPhase('scoring');
        setStep(1);

        const t1 = setTimeout(() => setStep(2), 600);
        const t2 = setTimeout(() => setStep(3), 1200);

        try {
            const scored = await scoreEntryPreview(trimmed);
            clearTimeout(t1);
            clearTimeout(t2);
            setResult(scored);
            setPhase('result');
        } catch (err) {
            clearTimeout(t1);
            clearTimeout(t2);
            setError(err instanceof Error ? err.message : 'Scoring failed');
            setPhase('idle');
            setStep(0);
        }
    }

    async function commit() {
        if (!result || committing) return;
        setCommitting(true);
        setError(null);
        try {
            const inserted = await commitScoredEntry({
                text: text.trim(),
                score: result.score,
                category: result.category,
                reasoning: result.reasoning,
                rubric_version: result.rubric_version,
            });
            onCommitted(inserted);
            setText('');
            setResult(null);
            setStep(0);
            setPhase('idle');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Commit failed');
        } finally {
            setCommitting(false);
        }
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void submit();
        }
    }

    const overLimit = text.length > MAX_LENGTH;
    const today = fmtToday();

    return (
        <div
            className="rounded-md border transition-colors focus-within:border-[var(--text-3)]"
            style={{
                background: 'var(--bg-1)',
                borderColor: 'var(--line-soft)',
            }}
        >
            {/* Head */}
            <div
                className="flex justify-between items-center font-mono uppercase border-b"
                style={{
                    padding: '10px 16px',
                    borderColor: 'var(--line-soft)',
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    color: 'var(--text-3)',
                }}
            >
                <span>New entry</span>
                <span style={{ color: 'var(--text-2)' }}>{today}</span>
            </div>

            {/* Textarea */}
            <textarea
                ref={taRef}
                placeholder="What happened today? Be specific — small moments price in too."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={phase !== 'idle'}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-0 outline-none resize-y disabled:opacity-60"
                style={{
                    minHeight: 96,
                    padding: 16,
                    fontSize: 15,
                    lineHeight: 1.55,
                    color: 'var(--text-0)',
                    fontFamily: 'var(--font-inter), system-ui, sans-serif',
                }}
            />

            {/* Foot */}
            <div
                className="flex justify-between items-center flex-wrap gap-2 border-t"
                style={{ padding: '10px 16px', borderColor: 'var(--line-soft)' }}
            >
                <span
                    className="font-mono"
                    style={{
                        fontSize: 11,
                        color: overLimit ? 'var(--loss)' : 'var(--text-3)',
                    }}
                >
                    {text.length} chars · ⌘↵ to score
                </span>
                <Btn
                    variant="amber"
                    onClick={submit}
                    disabled={!text.trim() || overLimit || phase !== 'idle'}
                >
                    {phase === 'idle' ? 'Score & post' : phase === 'scoring' ? 'Scoring…' : 'Scored'}
                </Btn>
            </div>

            {phase === 'scoring' && (
                <div
                    className="flex items-center font-mono border-t"
                    style={{
                        padding: '14px 16px',
                        gap: 14,
                        background: 'var(--bg-2)',
                        borderColor: 'var(--line-soft)',
                        fontSize: 12,
                        color: 'var(--text-1)',
                    }}
                >
                    <div
                        className="rounded-full yi-animate-spin shrink-0"
                        style={{
                            width: 12,
                            height: 12,
                            border: '1.5px solid var(--text-3)',
                            borderTopColor: 'var(--amber)',
                        }}
                    />
                    <div className="flex gap-[18px] flex-wrap">
                        {step >= 1 && (
                            <ScoringStep done={step > 1}>reading entry</ScoringStep>
                        )}
                        {step >= 2 && (
                            <ScoringStep done={step > 2}>weighing magnitude</ScoringStep>
                        )}
                        {step >= 3 && <ScoringStep done={false}>pricing in</ScoringStep>}
                    </div>
                </div>
            )}

            {phase === 'result' && result && (
                <div
                    className="yi-animate-fadein border-t"
                    style={{
                        padding: 16,
                        background: 'var(--bg-2)',
                        borderColor: 'var(--line-soft)',
                    }}
                >
                    <div className="flex items-center gap-3.5 mb-2 flex-wrap">
                        <div
                            className="font-mono"
                            style={{
                                fontSize: 22,
                                fontWeight: 600,
                                fontVariantNumeric: 'tabular-nums',
                                color: result.score >= 0 ? 'var(--gain)' : 'var(--loss)',
                            }}
                        >
                            {result.score >= 0 ? '+' : ''}
                            {result.score.toFixed(1)}
                        </div>
                        <Tag category={result.category}>{result.category}</Tag>
                        <Tag>{result.magnitude}</Tag>
                        <div className="flex-1" />
                        <Btn
                            variant="ghost"
                            onClick={() => {
                                setPhase('idle');
                                setResult(null);
                                setStep(0);
                            }}
                            disabled={committing}
                        >
                            Edit
                        </Btn>
                        <Btn variant="solid" onClick={commit} disabled={committing}>
                            {committing ? 'Committing…' : 'Commit to ledger'}
                        </Btn>
                    </div>
                    <div
                        className="italic"
                        style={{
                            fontFamily: 'var(--font-source-serif), Georgia, serif',
                            fontSize: 14,
                            color: 'var(--text-1)',
                            lineHeight: 1.5,
                        }}
                    >
                        &ldquo;{result.reasoning}&rdquo;
                    </div>
                </div>
            )}

            {error && (
                <div
                    className="font-mono border-t"
                    style={{
                        padding: '12px 16px',
                        borderColor: 'var(--line-soft)',
                        background: 'var(--loss-soft)',
                        color: 'var(--loss)',
                        fontSize: 12,
                    }}
                >
                    {error}
                </div>
            )}
        </div>
    );
}

function ScoringStep({ done, children }: { done: boolean; children: React.ReactNode }) {
    return (
        <span
            className="inline-flex items-center yi-animate-fadein"
            style={{ gap: 8, color: done ? 'var(--text-2)' : 'var(--text-1)' }}
        >
            {done && <span style={{ color: 'var(--gain)' }}>✓</span>}
            {children}
        </span>
    );
}

export function Btn({
    variant = 'solid',
    onClick,
    disabled,
    children,
    type = 'button',
    style,
}: {
    variant?: 'solid' | 'amber' | 'ghost';
    onClick?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    type?: 'button' | 'submit';
    style?: CSSProperties;
}) {
    const base: CSSProperties = {
        padding: '8px 14px',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        borderRadius: 4,
        fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
        transition: 'opacity 0.12s ease, transform 0.08s ease',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        border: variant === 'ghost' ? '1px solid var(--line)' : 'none',
    };
    let palette: CSSProperties = {};
    if (disabled) {
        palette = { background: 'var(--bg-3)', color: 'var(--text-3)' };
    } else if (variant === 'amber') {
        palette = { background: 'var(--amber)', color: 'var(--bg-0)' };
    } else if (variant === 'ghost') {
        palette = { background: 'transparent', color: 'var(--text-1)' };
    } else {
        palette = { background: 'var(--text-0)', color: 'var(--bg-0)' };
    }
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{ ...base, ...palette, ...style }}
            className="hover:opacity-85 active:translate-y-px disabled:hover:opacity-100"
        >
            {children}
        </button>
    );
}

export function Tag({
    category,
    children,
}: {
    category?: string;
    children: React.ReactNode;
}) {
    const c = category ? categoryColor(category) : null;
    return (
        <span
            className="inline-block font-mono uppercase rounded-[2px]"
            style={{
                padding: '2px 7px',
                fontSize: 9.5,
                letterSpacing: '0.08em',
                background: 'var(--bg-2)',
                color: c?.color ?? 'var(--text-2)',
                border: `1px solid ${c?.border ?? 'var(--line-soft)'}`,
            }}
        >
            {children}
        </span>
    );
}

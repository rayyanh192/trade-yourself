'use client';

import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { toPng } from 'html-to-image';
import { computePriceSeries, type PriceEntry, type PricePoint } from '@/lib/price';
import { currentQuarter } from '@/lib/quarter';
import type { Entry } from '@/lib/types';
import { fmtDateShort } from './format';
import { Btn, Tag } from './EntryBox';

type Range = 'quarter' | 'month' | 'ytd' | 'all' | 'custom';
type Phase = 'pick' | 'generating' | 'done';

type Props = {
    open: boolean;
    onClose: () => void;
    entries: Entry[];
    profile: {
        ticker: string;
        display_name: string;
        ipo_date: string;
        baseline_price: number;
    };
};

export function EarningsModal(props: Props) {
    if (!props.open) return null;
    return <EarningsModalInner {...props} />;
}

function EarningsModalInner({ onClose, entries, profile }: Props) {
    const [phase, setPhase] = useState<Phase>('pick');
    const [stepIdx, setStepIdx] = useState(0);
    const [range, setRange] = useState<Range>('quarter');
    const [customStart, setCustomStart] = useState(profile.ipo_date);
    const [customEnd, setCustomEnd] = useState(new Date().toISOString().slice(0, 10));
    const [saving, setSaving] = useState(false);
    const letterRef = useRef<HTMLDivElement>(null);

    async function saveAsPng() {
        const node = letterRef.current;
        if (!node || saving) return;
        setSaving(true);
        try {
            const dataUrl = await toPng(node, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: 'oklch(0.19 0.013 50)',
            });
            const link = document.createElement('a');
            const slug = `${profile.ticker}-${window_.label}`
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            link.download = `earnings-letter-${slug}.png`;
            link.href = dataUrl;
            link.click();
        } catch {
            // swallow — user can retry
        } finally {
            setSaving(false);
        }
    }

    const steps = [
        'reading the timeframe…',
        'finding the through-line…',
        'rendering chart…',
        'drafting the letter…',
    ];

    const window_ = useMemo(() => {
        const now = new Date();
        if (range === 'quarter') {
            const cq = currentQuarter();
            const start = new Date(cq.year, (cq.quarter - 1) * 3, 1);
            const end = new Date(cq.year, cq.quarter * 3, 0, 23, 59, 59);
            return { start, end, label: `Q${cq.quarter} ${cq.year}` };
        }
        if (range === 'month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            return {
                start,
                end,
                label: start.toLocaleString('en', { month: 'long', year: 'numeric' }),
            };
        }
        if (range === 'ytd') {
            const start = new Date(now.getFullYear(), 0, 1);
            return { start, end: now, label: `YTD ${now.getFullYear()}` };
        }
        if (range === 'all') {
            return { start: new Date(profile.ipo_date), end: now, label: 'Since IPO' };
        }
        return {
            start: new Date(customStart),
            end: new Date(customEnd + 'T23:59:59'),
            label: `${customStart} → ${customEnd}`,
        };
    }, [range, customStart, customEnd, profile]);

    const windowEntries = useMemo(() => {
        return entries.filter((e) => {
            const t = new Date(e.created_at);
            return t >= window_.start && t <= window_.end;
        });
    }, [entries, window_]);

    const sortedEntries = useMemo(() => {
        return [...entries].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
    }, [entries]);

    const fullSeries = useMemo<PricePoint[]>(() => {
        const priceEntries: PriceEntry[] = sortedEntries.map((e) => ({
            id: e.id,
            created_at: e.created_at,
            text: e.text,
            score: Number(e.score),
            magnitude: e.magnitude,
        }));
        return computePriceSeries({
            baseline_price: profile.baseline_price,
            ipo_date: profile.ipo_date,
            entries: priceEntries,
        });
    }, [sortedEntries, profile]);

    const miniSeries = useMemo(
        () =>
            fullSeries.filter((p) => {
                const t = new Date(p.date);
                return t >= window_.start && t <= window_.end;
            }),
        [fullSeries, window_],
    );

    const startGenerate = () => {
        setPhase('generating');
        setStepIdx(0);
        let i = 0;
        const tick = setInterval(() => {
            i += 1;
            if (i < steps.length) {
                setStepIdx(i);
            } else {
                clearInterval(tick);
                setTimeout(() => setPhase('done'), 600);
            }
        }, 700);
    };

    const gains = windowEntries
        .filter((e) => Number(e.score) > 0)
        .sort((a, b) => Number(b.score) - Number(a.score));
    const losses = windowEntries
        .filter((e) => Number(e.score) < 0)
        .sort((a, b) => Number(a.score) - Number(b.score));
    const topGains = gains.slice(0, 2);
    const topLosses = losses.slice(0, 2);
    const totalScore = windowEntries.reduce((s, e) => s + Number(e.score), 0);

    const startPrice = miniSeries.length ? miniSeries[0].price : profile.baseline_price;
    const endPrice = miniSeries.length
        ? miniSeries[miniSeries.length - 1].price
        : profile.baseline_price;
    const periodChange = endPrice - startPrice;
    const periodPct = startPrice === 0 ? 0 : (periodChange / startPrice) * 100;

    return (
        <div
            className="fixed inset-0 grid place-items-center yi-animate-fadein"
            style={{
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 100,
            }}
            onClick={onClose}
        >
            <div
                className="rounded-lg border flex flex-col overflow-hidden"
                style={{
                    width: 'min(820px, 94vw)',
                    maxHeight: '88vh',
                    background: 'var(--bg-1)',
                    borderColor: 'var(--line)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="flex justify-between items-center border-b"
                    style={{ padding: '16px 22px', borderColor: 'var(--line-soft)' }}
                >
                    <div
                        className="flex items-center gap-3 font-mono uppercase"
                        style={{
                            fontSize: 11,
                            letterSpacing: '0.08em',
                            color: 'var(--text-2)',
                        }}
                    >
                        <span>📄 earnings letter · {window_.label}</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="close"
                        className="grid place-items-center rounded transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--text-0)]"
                        style={{ width: 28, height: 28, color: 'var(--text-2)' }}
                    >
                        ✕
                    </button>
                </div>

                {phase === 'pick' && (
                    <div className="flex flex-col overflow-y-auto">
                        <div style={{ padding: '24px 28px 4px' }}>
                            <h2
                                style={{
                                    margin: '0 0 4px',
                                    fontFamily: 'var(--font-source-serif), Georgia, serif',
                                    fontSize: 22,
                                    fontWeight: 500,
                                    color: 'var(--text-0)',
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                Generate an earnings letter
                            </h2>
                            <p
                                style={{
                                    margin: 0,
                                    color: 'var(--text-2)',
                                    fontSize: 13,
                                    maxWidth: '60ch',
                                    lineHeight: 1.5,
                                }}
                            >
                                Pick a window. We&rsquo;ll synthesize your entries into a written
                                letter — chart, highlights, and a short narrative.
                            </p>
                        </div>

                        <div style={{ padding: '16px 28px' }}>
                            <PickerLabel>Timeframe</PickerLabel>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {(
                                    [
                                        { k: 'quarter', l: 'This quarter' },
                                        { k: 'month', l: 'This month' },
                                        { k: 'ytd', l: 'Year to date' },
                                        { k: 'all', l: 'Since IPO' },
                                        { k: 'custom', l: 'Custom…' },
                                    ] as const
                                ).map((o) => {
                                    const active = range === o.k;
                                    return (
                                        <button
                                            key={o.k}
                                            type="button"
                                            onClick={() => setRange(o.k)}
                                            className="font-mono text-center transition-all"
                                            style={{
                                                padding: '12px 8px',
                                                borderRadius: 6,
                                                border: '1px solid',
                                                borderColor: active
                                                    ? 'var(--amber)'
                                                    : 'var(--line-soft)',
                                                background: active
                                                    ? 'var(--amber)'
                                                    : 'var(--bg-2)',
                                                color: active ? 'var(--bg-0)' : 'var(--text-1)',
                                                fontSize: 11,
                                                fontWeight: active ? 600 : 500,
                                                letterSpacing: '0.04em',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {o.l}
                                        </button>
                                    );
                                })}
                            </div>
                            {range === 'custom' && (
                                <div
                                    className="flex gap-3.5 mt-3.5 rounded-md border"
                                    style={{
                                        padding: 14,
                                        background: 'var(--bg-2)',
                                        borderColor: 'var(--line-soft)',
                                    }}
                                >
                                    <DateInput
                                        label="From"
                                        value={customStart}
                                        onChange={setCustomStart}
                                    />
                                    <DateInput
                                        label="To"
                                        value={customEnd}
                                        onChange={setCustomEnd}
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '16px 28px' }}>
                            <PickerLabel>Preview</PickerLabel>
                            <div
                                className="grid grid-cols-2 sm:grid-cols-4 rounded-md border overflow-hidden"
                                style={{
                                    background: 'var(--bg-2)',
                                    borderColor: 'var(--line-soft)',
                                }}
                            >
                                <Tile k="Window" v={window_.label} />
                                <Tile k="Entries" v={String(windowEntries.length)} isMid />
                                <Tile
                                    k="Net score"
                                    v={`${totalScore >= 0 ? '+' : ''}${totalScore.toFixed(1)}`}
                                    color={totalScore >= 0 ? 'gain' : 'loss'}
                                />
                                <Tile
                                    k="Price change"
                                    v={`${periodChange >= 0 ? '+' : ''}${periodPct.toFixed(2)}%`}
                                    color={periodChange >= 0 ? 'gain' : 'loss'}
                                    isLast
                                />
                            </div>
                            {windowEntries.length === 0 && (
                                <div
                                    className="font-mono"
                                    style={{
                                        marginTop: 12,
                                        padding: '10px 14px',
                                        borderRadius: 4,
                                        background: 'var(--loss-soft)',
                                        border: '1px solid var(--loss)',
                                        color: 'var(--loss)',
                                        fontSize: 11,
                                    }}
                                >
                                    No entries fall in this window. Pick a different timeframe.
                                </div>
                            )}
                        </div>

                        <div
                            className="flex justify-end gap-2 border-t"
                            style={{
                                padding: '14px 28px',
                                borderColor: 'var(--line-soft)',
                                background: 'var(--bg-0)',
                            }}
                        >
                            <Btn variant="ghost" onClick={onClose}>
                                Cancel
                            </Btn>
                            <Btn
                                variant="amber"
                                onClick={startGenerate}
                                disabled={windowEntries.length === 0}
                            >
                                Generate letter →
                            </Btn>
                        </div>
                    </div>
                )}

                {phase === 'generating' && (
                    <div className="text-center" style={{ padding: '60px 36px' }}>
                        <div
                            className="rounded-full yi-animate-spin mx-auto"
                            style={{
                                width: 24,
                                height: 24,
                                border: '2px solid var(--text-3)',
                                borderTopColor: 'var(--amber)',
                                marginBottom: 16,
                            }}
                        />
                        <div
                            className="font-mono uppercase"
                            style={{
                                fontSize: 11,
                                letterSpacing: '0.1em',
                                color: 'var(--text-2)',
                                marginBottom: 6,
                            }}
                        >
                            writing your letter
                        </div>
                        <div
                            className="italic"
                            style={{
                                fontFamily: 'var(--font-source-serif), Georgia, serif',
                                color: 'var(--text-1)',
                                fontSize: 14,
                            }}
                        >
                            {steps[stepIdx]}
                        </div>
                    </div>
                )}

                {phase === 'done' && (
                    <>
                        <div
                            ref={letterRef}
                            className="overflow-y-auto"
                            style={{
                                padding: '28px 36px',
                                background: 'var(--bg-1)',
                            }}
                        >
                            <h1
                                style={{
                                    fontFamily: 'var(--font-source-serif), Georgia, serif',
                                    fontSize: 24,
                                    fontWeight: 600,
                                    margin: '0 0 4px',
                                    letterSpacing: '-0.01em',
                                    color: 'var(--text-0)',
                                }}
                            >
                                To the shareholder of ${profile.ticker},
                            </h1>
                            <div
                                className="font-mono uppercase border-b"
                                style={{
                                    fontSize: 11,
                                    letterSpacing: '0.06em',
                                    color: 'var(--text-2)',
                                    marginBottom: 24,
                                    paddingBottom: 16,
                                    borderColor: 'var(--line-soft)',
                                }}
                            >
                                {window_.label} · {windowEntries.length} entries · net score{' '}
                                {totalScore >= 0 ? '+' : ''}
                                {totalScore.toFixed(1)} · price {periodChange >= 0 ? '+' : ''}
                                {periodPct.toFixed(2)}%
                            </div>

                            <div
                                className="rounded-md border"
                                style={{
                                    margin: '12px 0 24px',
                                    background: 'var(--bg-2)',
                                    borderColor: 'var(--line-soft)',
                                    padding: '14px 16px 8px',
                                }}
                            >
                                <LetterMiniChart
                                    series={miniSeries}
                                    baseline={profile.baseline_price}
                                    highlights={[...topGains, ...topLosses]}
                                />
                                <div
                                    className="font-mono uppercase text-center"
                                    style={{
                                        fontSize: 10,
                                        color: 'var(--text-3)',
                                        letterSpacing: '0.06em',
                                        marginTop: 4,
                                    }}
                                >
                                    Fig. 1 — Price over {window_.label.toLowerCase()}.
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <HighlightCol kind="gain" entries={topGains} />
                                <HighlightCol kind="loss" entries={topLosses} />
                            </div>

                            <div
                                style={{
                                    fontFamily: 'var(--font-source-serif), Georgia, serif',
                                    fontSize: 16,
                                    lineHeight: 1.65,
                                    color: 'var(--text-0)',
                                }}
                            >
                                <p style={{ margin: '0 0 14px' }}>
                                    Over <strong>{window_.label.toLowerCase()}</strong>, the
                                    price moved {periodChange >= 0 ? '+' : ''}
                                    {periodPct.toFixed(2)}% across {windowEntries.length}{' '}
                                    entries.
                                    {topGains[0] || topLosses[0] ? (
                                        <>
                                            {' '}
                                            The biggest move was{' '}
                                            <em>
                                                &ldquo;
                                                {(topGains[0] && topLosses[0]
                                                    ? Math.abs(Number(topGains[0].score)) >=
                                                      Math.abs(Number(topLosses[0].score))
                                                        ? topGains[0]
                                                        : topLosses[0]
                                                    : topGains[0] ?? topLosses[0])!.text}
                                                &rdquo;
                                            </em>
                                            .
                                        </>
                                    ) : null}
                                </p>
                                <p
                                    className="italic"
                                    style={{ marginTop: 22, color: 'var(--text-1)' }}
                                >
                                    Yours,
                                    <br />
                                    {profile.display_name}, sole shareholder
                                </p>
                            </div>
                        </div>
                        <div
                            className="flex justify-between gap-2 flex-wrap border-t"
                            style={{
                                padding: '12px 22px',
                                borderColor: 'var(--line-soft)',
                            }}
                        >
                            <Btn variant="ghost" onClick={() => setPhase('pick')}>
                                ← Pick another timeframe
                            </Btn>
                            <div className="flex gap-2">
                                <Btn variant="ghost" onClick={onClose}>
                                    Close
                                </Btn>
                                <Btn
                                    variant="amber"
                                    onClick={saveAsPng}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving…' : 'Save as PNG'}
                                </Btn>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function PickerLabel({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="font-mono uppercase"
            style={{
                fontSize: 10,
                letterSpacing: '0.12em',
                color: 'var(--text-3)',
                marginBottom: 12,
            }}
        >
            {children}
        </div>
    );
}

function DateInput({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <label
            className="flex flex-col gap-1.5 font-mono uppercase"
            style={{
                flex: 1,
                fontSize: 10,
                letterSpacing: '0.1em',
                color: 'var(--text-3)',
            }}
        >
            <span>{label}</span>
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="rounded font-mono w-full"
                style={{
                    background: 'var(--bg-1)',
                    border: '1px solid var(--line)',
                    padding: '8px 10px',
                    color: 'var(--text-0)',
                    fontSize: 12,
                    colorScheme: 'dark',
                }}
            />
        </label>
    );
}

function Tile({
    k,
    v,
    color,
    isMid,
    isLast,
}: {
    k: string;
    v: string;
    color?: 'gain' | 'loss';
    isMid?: boolean;
    isLast?: boolean;
}) {
    void isMid;
    const valueColor =
        color === 'gain' ? 'var(--gain)' : color === 'loss' ? 'var(--loss)' : 'var(--text-0)';
    return (
        <div
            style={{
                padding: '14px 16px',
                borderRight: isLast ? 'none' : '1px solid var(--line-soft)',
            }}
        >
            <div
                className="font-mono uppercase"
                style={{
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    color: 'var(--text-3)',
                    marginBottom: 6,
                }}
            >
                {k}
            </div>
            <div
                className="font-mono"
                style={{
                    fontSize: 18,
                    fontWeight: 500,
                    color: valueColor,
                    fontVariantNumeric: 'tabular-nums',
                }}
            >
                {v}
            </div>
        </div>
    );
}

function HighlightCol({ kind, entries }: { kind: 'gain' | 'loss'; entries: Entry[] }) {
    const headColor = kind === 'gain' ? 'var(--gain)' : 'var(--loss)';
    const arrow = kind === 'gain' ? '▲' : '▼';
    const title = kind === 'gain' ? 'Top gains' : 'Top losses';
    return (
        <div
            className="rounded-md border"
            style={{
                background: 'var(--bg-2)',
                borderColor: 'var(--line-soft)',
                padding: '14px 16px',
            }}
        >
            <div
                className="font-mono uppercase border-b"
                style={{
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    color: headColor,
                    marginBottom: 10,
                    paddingBottom: 8,
                    borderColor: 'var(--line-soft)',
                }}
            >
                {arrow} {title}
            </div>
            {entries.length === 0 && (
                <div
                    className="font-mono"
                    style={{ fontSize: 11, color: 'var(--text-3)' }}
                >
                    No {kind === 'gain' ? 'positive' : 'negative'} entries this period.
                </div>
            )}
            {entries.map((e, i) => (
                <div
                    key={e.id}
                    style={{
                        padding: '8px 0',
                        borderBottom:
                            i < entries.length - 1 ? '1px solid var(--line-soft)' : 'none',
                    }}
                >
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                            className="font-mono"
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                fontVariantNumeric: 'tabular-nums',
                                color: headColor,
                            }}
                        >
                            {kind === 'gain' ? '+' : ''}
                            {Number(e.score).toFixed(1)}
                        </span>
                        {e.category && <Tag category={e.category}>{e.category}</Tag>}
                        <span
                            className="font-mono ml-auto"
                            style={{
                                fontSize: 10,
                                color: 'var(--text-3)',
                                letterSpacing: '0.04em',
                            }}
                        >
                            {fmtDateShort(e.created_at)}
                        </span>
                    </div>
                    <div
                        style={{
                            fontSize: 13,
                            color: 'var(--text-0)',
                            lineHeight: 1.4,
                        }}
                    >
                        {e.text}
                    </div>
                </div>
            ))}
        </div>
    );
}

function LetterMiniChart({
    series,
    baseline,
    highlights,
}: {
    series: PricePoint[];
    baseline: number;
    highlights: Entry[];
}) {
    if (!series || series.length < 2) {
        return (
            <div
                className="font-mono text-center"
                style={{ fontSize: 12, color: 'var(--text-3)', padding: 24 }}
            >
                Not enough data for chart.
            </div>
        );
    }
    const W = 640;
    const H = 180;
    const padL = 36;
    const padR = 12;
    const padT = 12;
    const padB = 22;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const dates = series.map((p) => new Date(p.date).getTime());
    const prices = series.map((p) => p.price);
    const minD = dates[0];
    const maxD = dates[dates.length - 1];
    const minP = Math.min(...prices, baseline) - 2;
    const maxP = Math.max(...prices, baseline) + 2;
    const xs = dates.map((d) => padL + (innerW * (d - minD)) / Math.max(1, maxD - minD));
    const ys = prices.map(
        (p) => padT + innerH - (innerH * (p - minP)) / Math.max(0.001, maxP - minP),
    );
    const path = xs
        .map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${ys[i].toFixed(2)}`)
        .join(' ');
    const area =
        path +
        ` L${xs[xs.length - 1].toFixed(2)},${(padT + innerH).toFixed(2)} L${xs[0].toFixed(
            2,
        )},${(padT + innerH).toFixed(2)} Z`;
    const isUp = prices[prices.length - 1] >= prices[0];
    const baselineY =
        padT + innerH - (innerH * (baseline - minP)) / Math.max(0.001, maxP - minP);

    const highlightIds = new Set(highlights.map((e) => e.id));

    const gainHex = 'oklch(0.78 0.16 145)';
    const lossHex = 'oklch(0.68 0.18 28)';

    const axisStyle: CSSProperties = {
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 10,
        fill: 'var(--text-3)',
        letterSpacing: '0.04em',
    };

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
            <defs>
                <linearGradient id="yi-letter-grad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={isUp ? gainHex : lossHex} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={isUp ? gainHex : lossHex} stopOpacity="0" />
                </linearGradient>
            </defs>
            <line
                x1={padL}
                x2={W - padR}
                y1={baselineY}
                y2={baselineY}
                stroke="var(--text-3)"
                strokeWidth={1}
                strokeDasharray="3 4"
            />
            <text x={W - padR} y={baselineY - 4} textAnchor="end" style={axisStyle}>
                IPO ${baseline}
            </text>
            <path d={area} fill="url(#yi-letter-grad)" />
            <path
                d={path}
                fill="none"
                stroke={isUp ? gainHex : lossHex}
                strokeWidth="1.75"
            />
            <text x={padL - 6} y={padT + 8} textAnchor="end" style={axisStyle}>
                ${maxP.toFixed(0)}
            </text>
            <text x={padL - 6} y={padT + innerH} textAnchor="end" style={axisStyle}>
                ${minP.toFixed(0)}
            </text>
            <text x={padL} y={H - 6} textAnchor="start" style={axisStyle}>
                {new Date(minD).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </text>
            <text x={W - padR} y={H - 6} textAnchor="end" style={axisStyle}>
                {new Date(maxD).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </text>
            {series.map((p, i) => {
                if (p.entry_id === 'ipo') return null;
                const isHighlight = highlightIds.has(p.entry_id);
                const isGain = p.score >= 0;
                return (
                    <g key={p.entry_id}>
                        <circle
                            cx={xs[i]}
                            cy={ys[i]}
                            r={isHighlight ? 4.5 : 2.2}
                            fill={isGain ? gainHex : lossHex}
                        />
                        {isHighlight && (
                            <circle
                                cx={xs[i]}
                                cy={ys[i]}
                                r={8}
                                fill="none"
                                stroke={isGain ? gainHex : lossHex}
                                strokeWidth="1"
                                strokeOpacity="0.45"
                            />
                        )}
                    </g>
                );
            })}
        </svg>
    );
}

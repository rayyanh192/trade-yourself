'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { PricePoint } from '@/lib/price';

type Props = {
    series: PricePoint[];
    baselinePrice: number;
    hoveredId: string | null;
    onHover: (id: string | null) => void;
};

const GAIN = 'oklch(0.78 0.16 145)';
const LOSS = 'oklch(0.68 0.18 28)';

export function PriceChartSVG({ series, baselinePrice, hoveredId, onHover }: Props) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [width, setWidth] = useState(900);
    const [drag, setDrag] = useState<{ startX: number; currentX: number } | null>(null);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const height = 320;
    const padL = 44;
    const padR = 18;
    const padT = 18;
    const padB = 28;
    const innerW = Math.max(100, width - padL - padR);
    const innerH = height - padT - padB;

    const computed = useMemo(() => {
        if (series.length === 0) return null;
        const dates = series.map((p) => new Date(p.date).getTime());
        const prices = series.map((p) => p.price);
        const minD = dates[0];
        const maxD = dates[dates.length - 1] + 1000 * 60 * 60 * 24 * 2;
        const minP = Math.min(...prices, baselinePrice) - 3;
        const maxP = Math.max(...prices, baselinePrice) + 3;
        const xs = dates.map((d) => padL + (innerW * (d - minD)) / Math.max(1, maxD - minD));
        const ys = prices.map(
            (p) => padT + innerH - (innerH * (p - minP)) / Math.max(0.001, maxP - minP),
        );
        return { dates, xs, ys, minP, maxP, minD, maxD };
    }, [series, innerW, innerH, baselinePrice, padL, padT]);

    useEffect(() => {
        if (!drag) return;
        const onMove = (e: MouseEvent) => {
            const svg = svgRef.current;
            if (!svg) return;
            const rect = svg.getBoundingClientRect();
            const ratio = width / rect.width;
            const rawX = (e.clientX - rect.left) * ratio;
            const x = Math.max(padL, Math.min(width - padR, rawX));
            setDrag((d) => (d ? { ...d, currentX: x } : d));
        };
        const onUp = () => setDrag(null);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [drag, width]);

    if (!computed || series.length < 2) {
        return (
            <div
                className="font-mono text-center"
                style={{
                    padding: '60px 18px',
                    fontSize: 12,
                    color: 'var(--text-3)',
                    letterSpacing: '0.04em',
                }}
            >
                Not enough data yet — write your first entry to start the chart.
            </div>
        );
    }

    const { xs, ys, dates, minP, maxP, minD, maxD } = computed;
    const baselineY =
        padT + innerH - (innerH * (baselinePrice - minP)) / Math.max(0.001, maxP - minP);

    const path = xs
        .map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${ys[i].toFixed(2)}`)
        .join(' ');
    const areaPath =
        path +
        ` L${xs[xs.length - 1].toFixed(2)},${(padT + innerH).toFixed(2)} L${xs[0].toFixed(2)},${(padT + innerH).toFixed(2)} Z`;

    const last = series[series.length - 1];
    const overallUp = last.price >= baselinePrice;

    const yTicks = (() => {
        const ticks: number[] = [];
        const niceStep = maxP - minP > 30 ? 10 : 5;
        const start = Math.ceil(minP / niceStep) * niceStep;
        for (let v = start; v <= maxP; v += niceStep) ticks.push(v);
        return ticks;
    })();

    const xTicks = (() => {
        const out: { t: number; x: number; label: string }[] = [];
        const startD = new Date(minD);
        startD.setDate(1);
        startD.setHours(0, 0, 0, 0);
        const cur = new Date(startD);
        while (cur.getTime() <= maxD + 1000 * 60 * 60 * 24 * 30) {
            const t = cur.getTime();
            if (t >= minD) {
                const x = padL + (innerW * (t - minD)) / Math.max(1, maxD - minD);
                out.push({
                    t,
                    x,
                    label: cur.toLocaleString('en', { month: 'short' }).toUpperCase(),
                });
            }
            cur.setMonth(cur.getMonth() + 1);
        }
        return out;
    })();

    const hoverIdx = hoveredId == null ? -1 : series.findIndex((p) => p.entry_id === hoveredId);
    const hovered = hoverIdx >= 0 ? series[hoverIdx] : null;
    const ttPos = hovered ? { x: xs[hoverIdx], y: ys[hoverIdx] } : null;

    const clientToSvgX = (clientX: number) => {
        const svg = svgRef.current;
        if (!svg) return clientX;
        const rect = svg.getBoundingClientRect();
        const ratio = width / rect.width;
        return (clientX - rect.left) * ratio;
    };
    const clampToPlot = (x: number) => Math.max(padL, Math.min(width - padR, x));

    const onPlotMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
        if (e.button !== 0) return;
        const x = clampToPlot(clientToSvgX(e.clientX));
        setDrag({ startX: x, currentX: x });
        e.preventDefault();
    };

    const band = drag
        ? { x1: Math.min(drag.startX, drag.currentX), x2: Math.max(drag.startX, drag.currentX) }
        : null;

    const bandSummary = (() => {
        if (!band || xs.length < 2) return null;
        const inside = series.map((p, i) => ({ p, x: xs[i] })).filter(({ x }) => x >= band.x1 && x <= band.x2);
        const priceAtX = (x: number) => {
            if (x <= xs[0]) return series[0].price;
            if (x >= xs[xs.length - 1]) return series[series.length - 1].price;
            for (let i = 1; i < xs.length; i++) {
                if (x <= xs[i]) {
                    const t = (x - xs[i - 1]) / Math.max(0.001, xs[i] - xs[i - 1]);
                    return series[i - 1].price + t * (series[i].price - series[i - 1].price);
                }
            }
            return series[series.length - 1].price;
        };
        const startPrice = priceAtX(band.x1);
        const endPrice = priceAtX(band.x2);
        const priceDelta = endPrice - startPrice;
        const pricePct = startPrice === 0 ? 0 : (priceDelta / startPrice) * 100;
        const pointCount = inside.filter(({ p }) => p.entry_id !== 'ipo').length;
        const scoreSum = inside.reduce(
            (s, { p }) => s + (p.entry_id === 'ipo' ? 0 : p.score),
            0,
        );
        return { startPrice, endPrice, priceDelta, pricePct, pointCount, scoreSum };
    })();

    const bandDates = (() => {
        if (!band || dates.length < 2) return null;
        const tFor = (x: number) => minD + ((x - padL) / Math.max(1, innerW)) * (maxD - minD);
        return { start: new Date(tFor(band.x1)), end: new Date(tFor(band.x2)) };
    })();

    const axisTextStyle: CSSProperties = {
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 10,
        fill: 'var(--text-3)',
        letterSpacing: '0.04em',
    };

    return (
        <div className="relative" ref={wrapRef} style={{ padding: '12px 18px 18px' }}>
            <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                onMouseDown={onPlotMouseDown}
                style={{
                    display: 'block',
                    width: '100%',
                    height: 320,
                    cursor: 'crosshair',
                    userSelect: 'none',
                }}
            >
                <defs>
                    <linearGradient id="yi-chart-gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop
                            offset="0%"
                            stopColor={overallUp ? GAIN : LOSS}
                            stopOpacity="0.18"
                        />
                        <stop
                            offset="100%"
                            stopColor={overallUp ? GAIN : LOSS}
                            stopOpacity="0"
                        />
                    </linearGradient>
                </defs>

                <g>
                    {yTicks.map((v) => {
                        const y =
                            padT + innerH - (innerH * (v - minP)) / Math.max(0.001, maxP - minP);
                        return (
                            <line
                                key={`g-${v}`}
                                x1={padL}
                                x2={width - padR}
                                y1={y}
                                y2={y}
                                stroke="var(--line-soft)"
                                strokeWidth={1}
                            />
                        );
                    })}
                </g>

                <g>
                    {yTicks.map((v) => {
                        const y =
                            padT + innerH - (innerH * (v - minP)) / Math.max(0.001, maxP - minP);
                        return (
                            <text
                                key={`yl-${v}`}
                                x={padL - 8}
                                y={y + 3}
                                textAnchor="end"
                                style={axisTextStyle}
                            >
                                ${v.toFixed(0)}
                            </text>
                        );
                    })}
                </g>

                <g>
                    {xTicks.map((t, i) => (
                        <text
                            key={`xl-${i}`}
                            x={t.x}
                            y={height - 8}
                            textAnchor="middle"
                            style={axisTextStyle}
                        >
                            {t.label}
                        </text>
                    ))}
                </g>

                <path
                    d={areaPath}
                    fill="url(#yi-chart-gradient)"
                    opacity="0.85"
                    pointerEvents="none"
                />
                <path
                    d={path}
                    fill="none"
                    stroke={overallUp ? GAIN : LOSS}
                    strokeWidth="1.75"
                    pointerEvents="none"
                />

                <line
                    x1={padL}
                    x2={width - padR}
                    y1={baselineY}
                    y2={baselineY}
                    stroke="var(--text-3)"
                    strokeWidth={1}
                    strokeDasharray="3 4"
                />
                <text
                    x={width - padR}
                    y={baselineY - 6}
                    textAnchor="end"
                    style={{ ...axisTextStyle, fill: 'var(--text-2)' }}
                >
                    IPO ${baselinePrice}
                </text>

                {hovered && ttPos && !drag && (
                    <line
                        x1={ttPos.x}
                        x2={ttPos.x}
                        y1={padT}
                        y2={padT + innerH}
                        stroke="var(--text-3)"
                        strokeWidth={1}
                        strokeDasharray="2 3"
                        pointerEvents="none"
                    />
                )}

                {band && bandSummary && (
                    <g pointerEvents="none">
                        <rect
                            x={band.x1}
                            y={padT}
                            width={Math.max(0, band.x2 - band.x1)}
                            height={innerH}
                            fill={
                                bandSummary.priceDelta >= 0
                                    ? 'var(--gain-soft)'
                                    : 'var(--loss-soft)'
                            }
                            stroke={bandSummary.priceDelta >= 0 ? GAIN : LOSS}
                            strokeOpacity="0.5"
                            strokeWidth="1"
                        />
                    </g>
                )}

                <g>
                    {series.map((p, i) => {
                        if (p.entry_id === 'ipo') return null;
                        const isUp = p.score >= 0;
                        const isHover = i === hoverIdx;
                        return (
                            <circle
                                key={p.entry_id}
                                cx={xs[i]}
                                cy={ys[i]}
                                r={isHover ? 5 : 3}
                                fill={isUp ? GAIN : LOSS}
                                style={{ cursor: 'pointer', transition: 'r 0.1s ease' }}
                                onMouseEnter={() => onHover(p.entry_id)}
                                onMouseLeave={() => onHover(null)}
                            />
                        );
                    })}
                </g>

                {hovered && ttPos && hovered.entry_id !== 'ipo' && (
                    <circle
                        cx={ttPos.x}
                        cy={ttPos.y}
                        r={6}
                        fill="var(--bg-0)"
                        stroke={hovered.score >= 0 ? GAIN : LOSS}
                        strokeWidth={2}
                        pointerEvents="none"
                    />
                )}

                <circle
                    cx={xs[xs.length - 1]}
                    cy={ys[ys.length - 1]}
                    r={4}
                    fill={overallUp ? GAIN : LOSS}
                />
                <circle
                    cx={xs[xs.length - 1]}
                    cy={ys[ys.length - 1]}
                    r={9}
                    fill="none"
                    stroke={overallUp ? GAIN : LOSS}
                    strokeOpacity="0.4"
                >
                    <animate
                        attributeName="r"
                        from="4"
                        to="14"
                        dur="1.8s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="stroke-opacity"
                        from="0.5"
                        to="0"
                        dur="1.8s"
                        repeatCount="indefinite"
                    />
                </circle>
            </svg>

            {hovered && ttPos && hovered.entry_id !== 'ipo' && !drag && (
                <ChartTooltip point={hovered} x={ttPos.x} y={ttPos.y} containerWidth={width} />
            )}

            {drag && bandSummary && bandDates && band && (
                <SelectionCallout
                    band={band}
                    summary={bandSummary}
                    dates={bandDates}
                    containerWidth={width}
                />
            )}
        </div>
    );
}

function ChartTooltip({
    point,
    x,
    y,
    containerWidth,
}: {
    point: PricePoint;
    x: number;
    y: number;
    containerWidth: number;
}) {
    const isGain = point.score >= 0;
    const ttWidth = 280;
    const flipLeft = x + 24 + ttWidth > containerWidth;
    const left = flipLeft ? x - ttWidth - 16 : x + 16;
    const top = Math.max(8, y - 60);

    return (
        <div
            className="absolute pointer-events-none"
            style={{
                left,
                top,
                width: ttWidth,
                background: 'var(--bg-0)',
                border: '1px solid var(--line)',
                borderRadius: 4,
                padding: '12px 14px',
                zIndex: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                fontSize: 13,
            }}
        >
            <div
                className="flex justify-between items-center font-mono uppercase border-b"
                style={{
                    marginBottom: 8,
                    paddingBottom: 8,
                    borderColor: 'var(--line-soft)',
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    color: 'var(--text-2)',
                }}
            >
                <span>
                    {new Date(point.date).toLocaleDateString('en', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                </span>
                <span
                    className="font-mono"
                    style={{
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                        color: isGain ? 'var(--gain)' : 'var(--loss)',
                    }}
                >
                    {isGain ? '+' : ''}
                    {point.score.toFixed(1)} · ${point.price.toFixed(2)}
                </span>
            </div>
            <div style={{ color: 'var(--text-0)', marginBottom: 8, lineHeight: 1.45 }}>
                {point.entry_text}
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
                <span
                    className="font-mono uppercase rounded-[2px]"
                    style={{
                        padding: '2px 7px',
                        fontSize: 9.5,
                        letterSpacing: '0.08em',
                        background: 'var(--bg-2)',
                        color: 'var(--text-2)',
                        border: '1px solid var(--line-soft)',
                    }}
                >
                    {point.magnitude}
                </span>
            </div>
        </div>
    );
}

function SelectionCallout({
    band,
    summary,
    dates,
    containerWidth,
}: {
    band: { x1: number; x2: number };
    summary: { priceDelta: number; pricePct: number; pointCount: number; scoreSum: number };
    dates: { start: Date; end: Date };
    containerWidth: number;
}) {
    const isGain = summary.priceDelta >= 0;
    const calloutW = 220;
    const center = (band.x1 + band.x2) / 2;
    const left = Math.max(8, Math.min(containerWidth - calloutW - 8, center - calloutW / 2));
    const fmtD = (d: Date) => d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    return (
        <div
            className="absolute"
            style={{
                left,
                top: 4,
                width: calloutW,
                background: 'var(--bg-0)',
                border: '1px solid var(--line)',
                borderRadius: 4,
                padding: '10px 12px',
                fontSize: 12,
                zIndex: 9,
                boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
            }}
        >
            <div
                className="flex justify-between items-center font-mono uppercase border-b"
                style={{
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    color: 'var(--text-2)',
                    marginBottom: 6,
                    paddingBottom: 6,
                    borderColor: 'var(--line-soft)',
                }}
            >
                <span>
                    {fmtD(dates.start)} → {fmtD(dates.end)}
                </span>
            </div>
            <div
                className="flex items-baseline gap-2 font-mono"
                style={{
                    fontSize: 22,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    color: isGain ? 'var(--gain)' : 'var(--loss)',
                    marginBottom: 6,
                }}
            >
                {isGain ? '+' : ''}${summary.priceDelta.toFixed(2)}
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-2)' }}>
                    {isGain ? '+' : ''}
                    {summary.pricePct.toFixed(2)}%
                </span>
            </div>
            <div
                className="flex justify-between font-mono"
                style={{ fontSize: 11, color: 'var(--text-2)', padding: '2px 0' }}
            >
                <span>Σ score</span>
                <span
                    style={{
                        color: summary.scoreSum >= 0 ? 'var(--gain)' : 'var(--loss)',
                        fontVariantNumeric: 'tabular-nums',
                    }}
                >
                    {summary.scoreSum >= 0 ? '+' : ''}
                    {summary.scoreSum.toFixed(1)}
                </span>
            </div>
            <div
                className="flex justify-between font-mono"
                style={{ fontSize: 11, color: 'var(--text-2)', padding: '2px 0' }}
            >
                <span>entries</span>
                <span style={{ color: 'var(--text-0)', fontVariantNumeric: 'tabular-nums' }}>
                    {summary.pointCount}
                </span>
            </div>
        </div>
    );
}

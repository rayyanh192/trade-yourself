'use client';

import { useMemo, useState } from 'react';
import { computePriceSeries, type PriceEntry } from '@/lib/price';
import type { Entry } from '@/lib/types';
import { TopBar } from './TopBar';
import { Header } from './Header';
import { Stats } from './Stats';
import { EntryBox } from './EntryBox';
import { PriceChartSVG } from './PriceChartSVG';
import { EntriesList } from './EntriesList';
import { EarningsCard } from './EarningsCard';
import { EarningsModal } from './EarningsModal';
import { Footer } from './Footer';
import { fmtDateShort, tickerFor } from './format';

type ChartRange = '1M' | '3M' | 'ALL';

type Props = {
    initialEntries: Entry[];
    profile: {
        display_name: string;
        ticker_symbol: string | null;
        ipo_date: string;
        baseline_price: number;
    };
    userEmail: string;
};

export function Dashboard({ initialEntries, profile, userEmail }: Props) {
    const [entries, setEntries] = useState<Entry[]>(initialEntries);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [earningsOpen, setEarningsOpen] = useState(false);
    const [chartRange, setChartRange] = useState<ChartRange>('ALL');

    const sortedEntries = useMemo(
        () =>
            [...entries].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            ),
        [entries],
    );

    const fullSeries = useMemo(() => {
        const priceEntries: PriceEntry[] = sortedEntries.map((e) => ({
            id: e.id,
            created_at: e.created_at,
            text: e.text,
            score: Number(e.score),
            magnitude: e.magnitude,
        }));
        return computePriceSeries({
            baseline_price: Number(profile.baseline_price ?? 100),
            ipo_date: profile.ipo_date,
            entries: priceEntries,
        });
    }, [sortedEntries, profile.baseline_price, profile.ipo_date]);

    const chartSeries = useMemo(() => {
        if (chartRange === 'ALL' || fullSeries.length < 2) return fullSeries;
        const last = new Date(fullSeries[fullSeries.length - 1].date).getTime();
        const days = chartRange === '1M' ? 31 : 93;
        const cutoff = last - days * 24 * 60 * 60 * 1000;
        const filtered = fullSeries.filter((p) => new Date(p.date).getTime() >= cutoff);
        return filtered.length < 2 ? fullSeries : filtered;
    }, [fullSeries, chartRange]);

    const baselinePrice = Number(profile.baseline_price ?? 100);
    const lastPrice = fullSeries[fullSeries.length - 1]?.price ?? baselinePrice;
    const change = lastPrice - baselinePrice;
    const pctChange = baselinePrice === 0 ? 0 : (change / baselinePrice) * 100;
    const lastUpdate = fullSeries.length
        ? fmtDateShort(fullSeries[fullSeries.length - 1].date)
        : fmtDateShort(profile.ipo_date);
    const ticker = tickerFor(profile);

    const handleCommitted = (entry: Entry) => {
        setEntries((prev) => [...prev, entry]);
    };

    return (
        <div
            className="flex flex-col"
            style={{ minHeight: '100vh', background: 'var(--bg-0)', color: 'var(--text-0)' }}
        >
            <div
                className="w-full mx-auto flex flex-col"
                style={{
                    maxWidth: 1200,
                    padding: '28px 40px',
                    gap: 28,
                    flex: 1,
                }}
            >
                <TopBar ipoDate={profile.ipo_date} />
                <Header
                    ticker={ticker}
                    displayName={profile.display_name}
                    currentPrice={lastPrice}
                    change={change}
                    pctChange={pctChange}
                    totalEntries={entries.length}
                    lastUpdate={lastUpdate}
                    ipoDate={profile.ipo_date}
                />
                <Stats series={fullSeries} entries={entries} />

                <EntryBox onCommitted={handleCommitted} />

                <div
                    className="rounded-md border overflow-hidden"
                    style={{
                        background: 'var(--bg-1)',
                        borderColor: 'var(--line-soft)',
                    }}
                >
                    <div
                        className="flex justify-between items-center border-b"
                        style={{ padding: '14px 18px', borderColor: 'var(--line-soft)' }}
                    >
                        <h2
                            className="font-mono uppercase m-0"
                            style={{
                                fontSize: 11,
                                fontWeight: 500,
                                letterSpacing: '0.1em',
                                color: 'var(--text-2)',
                            }}
                        >
                            price history
                        </h2>
                        <div className="flex gap-0.5">
                            {(['1M', '3M', 'ALL'] as const).map((r) => {
                                const active = chartRange === r;
                                return (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setChartRange(r)}
                                        className="font-mono transition-colors hover:text-[var(--text-0)] hover:bg-[var(--bg-2)]"
                                        style={{
                                            padding: '4px 10px',
                                            fontSize: 11,
                                            fontWeight: 500,
                                            letterSpacing: '0.04em',
                                            borderRadius: 3,
                                            color: active ? 'var(--text-0)' : 'var(--text-2)',
                                            background: active
                                                ? 'var(--bg-3)'
                                                : 'transparent',
                                        }}
                                    >
                                        {r}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <PriceChartSVG
                        series={chartSeries}
                        baselinePrice={baselinePrice}
                        hoveredId={hoveredId}
                        onHover={setHoveredId}
                    />
                </div>

                <EntriesList
                    entries={entries}
                    hoveredId={hoveredId}
                    onHover={setHoveredId}
                />

                <EarningsCard entries={entries} onGenerate={() => setEarningsOpen(true)} />
            </div>

            <Footer email={userEmail} />

            <EarningsModal
                open={earningsOpen}
                onClose={() => setEarningsOpen(false)}
                entries={entries}
                profile={{
                    ticker,
                    display_name: profile.display_name,
                    ipo_date: profile.ipo_date,
                    baseline_price: baselinePrice,
                }}
            />
        </div>
    );
}

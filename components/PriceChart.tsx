'use client';

// Stock-chart visualization. Tremor LineChart over a server-computed price series.
// Click a point to open the entry modal. If Tremor's onValueChange proves
// flaky in practice (known per the eng review), we swap to Recharts directly
// without changing the public API of this component.

import { LineChart } from '@tremor/react';
import { useState } from 'react';
import type { PricePoint } from '@/lib/price';
import { EntryModal } from './EntryModal';

type Props = {
    data: PricePoint[];
    baselinePrice: number;
    ipoDate: string | null;
};

type ChartDatum = {
    date: string;
    price: number;
    entry_id: string;
    entry_text: string;
};

export function PriceChart({ data, baselinePrice, ipoDate }: Props) {
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

    const chartData: ChartDatum[] = data.map((p) => ({
        date: p.date.slice(0, 10),       // YYYY-MM-DD for x-axis
        price: Number(p.price.toFixed(2)),
        entry_id: p.entry_id,
        entry_text: p.entry_text,
    }));

    const currentPrice = chartData.at(-1)?.price ?? baselinePrice;
    const isUp = currentPrice >= baselinePrice;

    return (
        <div className="w-full">
            <LineChart
                className="h-72"
                data={chartData}
                index="date"
                categories={['price']}
                colors={[isUp ? 'emerald' : 'rose']}
                valueFormatter={(n: number) => `$${n.toFixed(2)}`}
                yAxisWidth={64}
                showLegend={false}
                showGridLines={false}
                showAnimation
                onValueChange={(v) => {
                    // Tremor passes the hovered/clicked datum; wire to modal.
                    if (v && typeof v === 'object' && 'entry_id' in v) {
                        const id = (v as { entry_id?: string }).entry_id;
                        if (id && id !== 'ipo') setSelectedEntryId(id);
                    }
                }}
            />

            {ipoDate && (
                <p className="text-xs text-neutral-600 mt-2 font-mono">
                    ${baselinePrice.toFixed(2)} baseline since {ipoDate}
                </p>
            )}

            <EntryModal
                entryId={selectedEntryId}
                onClose={() => setSelectedEntryId(null)}
            />
        </div>
    );
}

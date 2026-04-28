// Pure compounding-price function. No DB, no React, no Next. Lives here so
// it's testable in isolation and so the same logic runs server-side (in
// dashboard/page.tsx) and is shippable to the client when the chart needs it.
//
// Formula: price[t] = baseline_price * Π(1 + score_i / 100) for all entries up to t.
// The first point is a synthetic anchor at the IPO date with the baseline price.

export type PriceEntry = {
    id: string;
    created_at: string;       // ISO 8601
    text: string;
    score: number;            // -10 to +10
    magnitude: 'small' | 'medium' | 'large';
};

export type PricePoint = {
    date: string;             // ISO date
    price: number;
    entry_id: string;         // 'ipo' for the synthetic anchor, otherwise the entry id
    entry_text: string;       // tooltip / modal trigger
    score: number;            // 0 for the synthetic anchor
    magnitude: 'small' | 'medium' | 'large';
};

export function computePriceSeries(input: {
    baseline_price: number;
    ipo_date: string;
    entries: PriceEntry[];
}): PricePoint[] {
    const sorted = input.entries
        .slice()
        .sort((a, b) => a.created_at.localeCompare(b.created_at));

    const points: PricePoint[] = [
        {
            date: input.ipo_date,
            price: input.baseline_price,
            entry_id: 'ipo',
            entry_text: 'IPO baseline',
            score: 0,
            magnitude: 'small',
        },
    ];

    let runningPrice = input.baseline_price;
    for (const e of sorted) {
        runningPrice = runningPrice * (1 + e.score / 100);
        points.push({
            date: e.created_at,
            price: runningPrice,
            entry_id: e.id,
            entry_text: e.text,
            score: e.score,
            magnitude: e.magnitude,
        });
    }

    return points;
}

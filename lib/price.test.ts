import { describe, it, expect } from 'vitest';
import { computePriceSeries, type PriceEntry } from './price';

const IPO = '2024-03-04';

function entry(over: Partial<PriceEntry> = {}): PriceEntry {
    return {
        id: over.id ?? 'e1',
        created_at: over.created_at ?? '2024-04-01T12:00:00Z',
        text: over.text ?? 'sample',
        score: over.score ?? 0,
        magnitude: over.magnitude ?? 'small',
    };
}

describe('computePriceSeries', () => {
    it('empty entries returns the synthetic IPO anchor at baseline_price', () => {
        const points = computePriceSeries({
            baseline_price: 100,
            ipo_date: IPO,
            entries: [],
        });
        expect(points).toHaveLength(1);
        expect(points[0]).toMatchObject({
            date: IPO,
            price: 100,
            entry_id: 'ipo',
            score: 0,
        });
    });

    it('one entry +5 gives a second point at price 105', () => {
        const points = computePriceSeries({
            baseline_price: 100,
            ipo_date: IPO,
            entries: [entry({ id: 'e1', score: 5, created_at: '2024-04-01' })],
        });
        expect(points).toHaveLength(2);
        expect(points[1].price).toBeCloseTo(105, 5);
        expect(points[1].entry_id).toBe('e1');
    });

    it('two entries +5 then -5 do NOT return to baseline (compounding asymmetry)', () => {
        const points = computePriceSeries({
            baseline_price: 100,
            ipo_date: IPO,
            entries: [
                entry({ id: 'a', score: 5, created_at: '2024-04-01' }),
                entry({ id: 'b', score: -5, created_at: '2024-04-02' }),
            ],
        });
        // 100 * 1.05 * 0.95 = 99.75 — proves we're compounding, not summing.
        expect(points[2].price).toBeCloseTo(99.75, 5);
        expect(points[2].price).not.toBe(100);
    });

    it('negative score sequence compounds correctly', () => {
        const points = computePriceSeries({
            baseline_price: 100,
            ipo_date: IPO,
            entries: [
                entry({ id: 'a', score: -10, created_at: '2024-04-01' }),
                entry({ id: 'b', score: -10, created_at: '2024-04-02' }),
            ],
        });
        // 100 * 0.9 * 0.9 = 81
        expect(points[2].price).toBeCloseTo(81, 5);
    });

    it('entries out of chronological order are sorted before computing', () => {
        const points = computePriceSeries({
            baseline_price: 100,
            ipo_date: IPO,
            entries: [
                entry({ id: 'second', score: -5, created_at: '2024-04-02' }),
                entry({ id: 'first', score: 5, created_at: '2024-04-01' }),
            ],
        });
        expect(points.map((p) => p.entry_id)).toEqual(['ipo', 'first', 'second']);
        // Same final price as the canonical asymmetry test.
        expect(points[2].price).toBeCloseTo(99.75, 5);
    });

    it('baseline of 200 (custom IPO baseline) compounds from 200, not 100', () => {
        const points = computePriceSeries({
            baseline_price: 200,
            ipo_date: IPO,
            entries: [entry({ id: 'a', score: 10, created_at: '2024-04-01' })],
        });
        expect(points[0].price).toBe(200);
        expect(points[1].price).toBeCloseTo(220, 5);
    });
});

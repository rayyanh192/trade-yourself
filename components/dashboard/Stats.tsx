import type { PricePoint } from '@/lib/price';
import type { Entry } from '@/lib/types';
import { fmtMoney, fmtDateShort } from './format';

export function Stats({
    series,
    entries,
}: {
    series: PricePoint[];
    entries: Entry[];
}) {
    if (series.length === 0) return null;

    const last = series[series.length - 1];
    const prev = series.length > 1 ? series[series.length - 2] : last;
    const dayChange = last.price - prev.price;
    const dayPct = prev.price === 0 ? 0 : (dayChange / prev.price) * 100;

    const high = series.reduce((m, p) => (p.price > m.price ? p : m), series[0]);
    const low = series.reduce((m, p) => (p.price < m.price ? p : m), series[0]);

    const avgScore = entries.length
        ? entries.reduce((s, e) => s + Number(e.score), 0) / entries.length
        : 0;

    return (
        <div
            className="grid grid-cols-2 md:grid-cols-4 border-t border-b"
            style={{ borderColor: 'var(--line-soft)' }}
        >
            <Stat
                label="Last entry Δ"
                value={`${dayChange >= 0 ? '+' : ''}$${fmtMoney(dayChange)}`}
                sub={`${dayChange >= 0 ? '+' : ''}${dayPct.toFixed(2)}%`}
                color={dayChange >= 0 ? 'gain' : 'loss'}
                isFirst
            />
            <Stat
                label="All-time high"
                value={`$${fmtMoney(high.price)}`}
                sub={fmtDateShort(high.date)}
            />
            <Stat
                label="All-time low"
                value={`$${fmtMoney(low.price)}`}
                sub={fmtDateShort(low.date)}
            />
            <Stat
                label="Avg score"
                value={`${avgScore >= 0 ? '+' : ''}${avgScore.toFixed(2)}`}
                sub={`over ${entries.length} entries`}
                color={avgScore >= 0 ? 'gain' : 'loss'}
                isLast
            />
        </div>
    );
}

function Stat({
    label,
    value,
    sub,
    color,
    isFirst,
    isLast,
}: {
    label: string;
    value: string;
    sub: string;
    color?: 'gain' | 'loss';
    isFirst?: boolean;
    isLast?: boolean;
}) {
    const valueColor =
        color === 'gain' ? 'var(--gain)' : color === 'loss' ? 'var(--loss)' : 'var(--text-0)';
    return (
        <div
            className={isLast ? '' : 'border-r'}
            style={{
                borderColor: 'var(--line-soft)',
                padding: '14px 18px',
                paddingLeft: isFirst ? 0 : 18,
            }}
        >
            <div
                className="font-mono uppercase"
                style={{
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    color: 'var(--text-3)',
                    marginBottom: 4,
                }}
            >
                {label}
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
                {value}
            </div>
            <div
                className="font-mono"
                style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}
            >
                {sub}
            </div>
        </div>
    );
}

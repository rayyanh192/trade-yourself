import { splitDollarCents } from './format';

type Props = {
    ticker: string;
    displayName: string;
    currentPrice: number;
    change: number;
    pctChange: number;
    totalEntries: number;
    lastUpdate: string;
    ipoDate: string;
};

export function Header({
    ticker,
    displayName,
    currentPrice,
    change,
    pctChange,
    totalEntries,
    lastUpdate,
    ipoDate,
}: Props) {
    const isUp = pctChange >= 0;
    const sign = isUp ? '+' : '';
    const { dollars, cents } = splitDollarCents(currentPrice);

    return (
        <header className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
                <div className="flex items-baseline gap-4 flex-wrap mb-1.5">
                    <div
                        className="font-mono font-bold"
                        style={{
                            color: 'var(--text-0)',
                            fontSize: 36,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>$</span>
                        {ticker}
                    </div>
                    <div
                        className="font-sans"
                        style={{ color: 'var(--text-2)', fontSize: 13 }}
                    >
                        {displayName} · personal stock
                    </div>
                </div>
                <div className="flex items-baseline gap-3 flex-wrap">
                    <div
                        className="font-mono"
                        style={{
                            color: 'var(--text-0)',
                            fontSize: 64,
                            fontWeight: 600,
                            letterSpacing: '-0.02em',
                            lineHeight: 1,
                            fontVariantNumeric: 'tabular-nums',
                        }}
                    >
                        ${dollars}
                        <span style={{ color: 'var(--text-1)' }}>{cents}</span>
                    </div>
                    <div
                        className="flex items-center gap-1.5 font-mono flex-wrap"
                        style={{
                            color: isUp ? 'var(--gain)' : 'var(--loss)',
                            fontSize: 16,
                            fontWeight: 500,
                            fontVariantNumeric: 'tabular-nums',
                        }}
                    >
                        <span style={{ fontSize: 12 }}>{isUp ? '▲' : '▼'}</span>
                        <span>
                            {sign}
                            {change.toFixed(2)}
                        </span>
                        <span style={{ color: 'var(--text-3)' }}>·</span>
                        <span>
                            {sign}
                            {pctChange.toFixed(2)}%
                        </span>
                        <span style={{ color: 'var(--text-3)', marginLeft: 6, fontSize: 11 }}>
                            SINCE IPO
                        </span>
                    </div>
                </div>
            </div>
            <div
                className="text-left md:text-right font-mono uppercase"
                style={{
                    color: 'var(--text-2)',
                    fontSize: 11,
                    letterSpacing: '0.04em',
                    lineHeight: 1.7,
                }}
            >
                <div>
                    <span style={{ color: 'var(--text-3)' }}>IPO</span>{' '}
                    <span style={{ color: 'var(--text-1)' }}>{ipoDate}</span>
                </div>
                <div>
                    <span style={{ color: 'var(--text-3)' }}>ENTRIES</span>{' '}
                    <span style={{ color: 'var(--text-1)' }}>{totalEntries}</span>
                </div>
                <div>
                    <span style={{ color: 'var(--text-3)' }}>UPDATED</span>{' '}
                    <span style={{ color: 'var(--text-1)' }}>{lastUpdate}</span>
                </div>
            </div>
        </header>
    );
}

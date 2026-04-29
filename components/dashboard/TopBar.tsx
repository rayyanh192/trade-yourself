import { daysSince } from './format';

export function TopBar({ ipoDate }: { ipoDate: string }) {
    return (
        <div
            className="flex justify-between items-center pb-[18px] border-b font-mono uppercase"
            style={{
                borderColor: 'var(--line-soft)',
                color: 'var(--text-2)',
                fontSize: 11,
                letterSpacing: '0.08em',
            }}
        >
            <div className="flex items-center gap-2.5">
                <div
                    className="grid place-items-center font-bold rounded-[2px]"
                    style={{
                        width: 18,
                        height: 18,
                        background: 'var(--amber)',
                        color: 'var(--bg-0)',
                        fontSize: 10,
                    }}
                >
                    y
                </div>
                <span>youinc · personal stock journal</span>
            </div>
            <div className="flex items-center gap-2">
                <span
                    className="rounded-full yi-animate-pulse-dot"
                    style={{
                        width: 6,
                        height: 6,
                        background: 'var(--gain)',
                        boxShadow: '0 0 8px var(--gain)',
                    }}
                />
                <span>market open · day {daysSince(ipoDate)}</span>
            </div>
        </div>
    );
}

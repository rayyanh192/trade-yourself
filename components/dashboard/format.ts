// Shared formatters for dashboard components. Pure functions, no React.

export function fmtMoney(n: number): string {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDateShort(iso: string): string {
    return new Date(iso).toLocaleString('en', { month: 'short', day: 'numeric' });
}

export function fmtDateLong(iso: string): string {
    return new Date(iso).toLocaleString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtTime(iso: string): string {
    return new Date(iso).toLocaleString('en', { hour: 'numeric', minute: '2-digit' });
}

export function fmtToday(): string {
    return new Date().toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function daysSince(isoDate: string): number {
    const start = new Date(isoDate.includes('T') ? isoDate : isoDate + 'T00:00:00Z');
    return Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function splitDollarCents(price: number): { dollars: number; cents: string } {
    const dollars = Math.floor(price);
    const cents = (price - dollars).toFixed(2).slice(1);
    return { dollars, cents };
}

export function tickerFor(profile: { ticker_symbol: string | null; display_name: string }): string {
    return (profile.ticker_symbol ?? profile.display_name?.slice(0, 4) ?? 'YOU').toUpperCase();
}

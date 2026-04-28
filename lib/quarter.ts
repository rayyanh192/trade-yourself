// Quarter math. Pure helpers, used by both client (EarningsLetterButton) and
// server (actions/earnings.ts). Lives outside actions/ because 'use server'
// files can only export async functions.

export function currentQuarter(): { year: number; quarter: 1 | 2 | 3 | 4 } {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth(); // 0-11
    const quarter = (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4;
    return { year, quarter };
}

export function quarterRange(year: number, quarter: 1 | 2 | 3 | 4) {
    const startMonth = (quarter - 1) * 3;
    const start = new Date(Date.UTC(year, startMonth, 1));
    const end = new Date(Date.UTC(year, startMonth + 3, 1));
    return { start: start.toISOString(), end: end.toISOString() };
}

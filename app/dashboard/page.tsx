// V0 dashboard — Step 5 version: header + textbox + chart + entries list.
// Step 6 adds the onboarding gate.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEntries } from '@/actions/entries';
import { currentQuarter } from '@/lib/quarter';
import { computePriceSeries, type PriceEntry } from '@/lib/price';
import { EntryTextbox } from '@/components/EntryTextbox';
import { PriceChart } from '@/components/PriceChart';
import { EarningsLetterButton } from '@/components/EarningsLetterButton';
import { SignOutButton } from '../sign-out-button';

export default async function Dashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('users')
        .select('display_name, ticker_symbol, ipo_date, baseline_price')
        .eq('id', user.id)
        .single();

    if (!profile?.ipo_date) redirect('/onboarding');

    const entries = await getEntries();

    const baselinePrice = Number(profile.baseline_price ?? 100);
    const priceEntries: PriceEntry[] = entries.map((e) => ({
        id: e.id,
        created_at: e.created_at,
        text: e.text,
        score: Number(e.score),
        magnitude: e.magnitude,
    }));
    const series = computePriceSeries({
        baseline_price: baselinePrice,
        ipo_date: profile.ipo_date,
        entries: priceEntries,
    });

    const currentPrice = series.at(-1)?.price ?? baselinePrice;
    const percentChange = ((currentPrice - baselinePrice) / baselinePrice) * 100;
    const ticker = (profile.ticker_symbol ?? profile.display_name?.slice(0, 4) ?? 'YOU').toUpperCase();

    return (
        <main className="min-h-screen bg-black text-neutral-200 p-6 md:p-12">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-8">
                    <span className="font-mono text-sm text-neutral-500">${ticker}</span>
                    <span className="font-mono text-3xl text-neutral-100">
                        ${currentPrice.toFixed(2)}
                    </span>
                    <span className={`font-mono text-base ${percentChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
                    </span>
                    <span className="text-xs text-neutral-500 ml-auto">
                        since {profile.ipo_date}
                    </span>
                </header>

                {/* Textbox */}
                <section className="mb-8">
                    <EntryTextbox />
                </section>

                {/* Chart */}
                <section className="mb-8 border border-neutral-900 rounded-lg p-4 bg-neutral-950">
                    <PriceChart
                        data={series}
                        baselinePrice={baselinePrice}
                        ipoDate={profile.ipo_date}
                    />
                </section>

                {/* Recent entries list (fallback so the user can always re-read; click-on-chart-point is the primary path) */}
                <section className="mb-8">
                    <h2 className="text-sm text-neutral-500 mb-3 font-mono uppercase tracking-wider">
                        Recent entries ({entries.length})
                    </h2>
                    {entries.length === 0 ? (
                        <p className="text-neutral-500 text-sm">
                            Write your first entry above. The chart will start tracking from today.
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {entries.slice().reverse().slice(0, 10).map((e) => (
                                <li
                                    key={e.id}
                                    className="border border-neutral-900 rounded p-3 bg-neutral-950"
                                >
                                    <div className="flex justify-between items-baseline mb-1.5">
                                        <span className="text-xs font-mono text-neutral-500">
                                            {new Date(e.created_at).toLocaleString()}
                                        </span>
                                        <span className={`font-mono text-sm ${Number(e.score) > 0 ? 'text-emerald-400' : Number(e.score) < 0 ? 'text-rose-400' : 'text-neutral-400'}`}>
                                            {Number(e.score) > 0 ? '+' : ''}{Number(e.score).toFixed(1)}
                                            <span className="text-neutral-500 text-xs ml-2">
                                                {e.category} · {e.magnitude}
                                            </span>
                                        </span>
                                    </div>
                                    <p className="text-neutral-200 text-sm whitespace-pre-wrap">{e.text}</p>
                                    <p className="text-xs text-neutral-500 italic mt-2">{e.llm_reasoning}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Earnings letter */}
                <section className="mb-8">
                    <EarningsLetterButton
                        hasCurrentQuarterEntries={(() => {
                            const { year, quarter } = currentQuarter();
                            const startMonth = (quarter - 1) * 3;
                            const start = new Date(Date.UTC(year, startMonth, 1)).toISOString();
                            const end = new Date(Date.UTC(year, startMonth + 3, 1)).toISOString();
                            return entries.some((e) => e.created_at >= start && e.created_at < end);
                        })()}
                    />
                </section>

                {/* Footer */}
                <footer className="mt-12 pt-6 border-t border-neutral-900 flex justify-between text-xs">
                    <span className="text-neutral-600">Signed in as {user.email}</span>
                    <SignOutButton />
                </footer>
            </div>
        </main>
    );
}

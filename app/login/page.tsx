'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setStatus('sending');
        setErrorMsg(null);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setStatus('error');
            setErrorMsg(error.message);
        } else {
            setStatus('sent');
        }
    }

    if (status === 'sent') {
        return (
            <main className="min-h-screen bg-black text-neutral-200 flex items-center justify-center p-6">
                <div className="max-w-md text-center">
                    <h1 className="text-3xl font-medium mb-3">Check your email.</h1>
                    <p className="text-neutral-400">
                        We sent a magic link to <span className="text-neutral-200">{email}</span>.
                        Click it to sign in.
                    </p>
                    <p className="text-neutral-500 text-sm mt-6">
                        Wrong email?{' '}
                        <button
                            onClick={() => {
                                setStatus('idle');
                                setEmail('');
                            }}
                            className="underline hover:text-neutral-300"
                        >
                            Try again
                        </button>
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-neutral-200 flex items-center justify-center p-6">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm flex flex-col gap-4"
            >
                <h1 className="text-3xl font-medium mb-2">Sign in to youinc.</h1>
                <p className="text-neutral-400 text-sm mb-4">
                    Enter your email. We'll send you a magic link.
                </p>

                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={status === 'sending'}
                    autoFocus
                    className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-base
                               focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600
                               disabled:opacity-50"
                />

                <button
                    type="submit"
                    disabled={status === 'sending' || !email}
                    className="bg-neutral-100 text-black rounded px-3 py-2.5 text-base font-medium
                               hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed
                               transition-colors"
                >
                    {status === 'sending' ? 'Sending...' : 'Send magic link'}
                </button>

                {errorMsg && (
                    <p className="text-rose-400 text-sm mt-1">{errorMsg}</p>
                )}
            </form>
        </main>
    );
}

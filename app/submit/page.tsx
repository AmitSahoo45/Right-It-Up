'use client';

import { ClientNavbar } from '@/components/ClientNavbar';
import { CaseForm } from '@/components/CaseForm';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function SubmitPage() {
    const { user, quota, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen">
                <ClientNavbar />
                <main className="pt-28 md:pt-32 px-4 md:px-10 pb-20">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="animate-pulse">
                            <div className="h-8 bg-charcoal-layer/50 rounded-full w-32 mx-auto mb-4"></div>
                            <div className="h-12 bg-charcoal-layer/50 rounded-xl w-64 mx-auto mb-4"></div>
                            <div className="h-6 bg-charcoal-layer/50 rounded-lg w-48 mx-auto"></div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <ClientNavbar />

            <main className="pt-28 md:pt-32 px-4 md:px-10 pb-20">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-electric-violet/20 text-electric-violet text-xs font-bold rounded-full mb-4">
                            <span>📋</span>
                            <span>STEP 1 OF 3</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-starlight-white mb-4">
                            State Your Case
                        </h1>
                        <p className="text-steel-grey text-lg max-w-md mx-auto">
                            Tell us your side of the story. Be honest, be detailed, bring receipts.
                        </p>
                    </div>

                    {/* Quota Warning */}
                    {!quota.can_use ? (
                        <div className="bg-objection-red/10 border border-objection-red/30 rounded-2xl p-6 mb-8">
                            <div className="flex items-start gap-4">
                                <div className="text-3xl">🚫</div>
                                <div>
                                    <h3 className="text-objection-red font-bold text-lg mb-2">
                                        {user ? 'Daily Limit Reached' : 'Free Verdict Used'}
                                    </h3>
                                    <p className="text-steel-grey mb-4">
                                        {user
                                            ? "You've used all 5 verdicts for today. Your limit resets in 24 hours."
                                            : "You've used your free verdict. Sign in to get 5 verdicts per day!"
                                        }
                                    </p>
                                    {!user && (
                                        <Link
                                            href="/login"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-electric-violet to-cyber-blue text-white font-bold rounded-xl hover:shadow-electric-glow transition-all"
                                        >
                                            Sign In for More Verdicts
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Quota Info */}
                            <div className="flex items-center justify-center gap-2 mb-8">
                                <div className={`w-2 h-2 rounded-full ${quota.remaining > 2 ? 'bg-verdict-green' : quota.remaining > 0 ? 'bg-caution-amber' : 'bg-objection-red'} animate-pulse`}></div>
                                <span className="text-steel-grey text-sm">
                                    {user ? (
                                        <>{quota.remaining} verdict{quota.remaining !== 1 ? 's' : ''} remaining today</>
                                    ) : (
                                        <>1 free verdict available</>
                                    )}
                                </span>
                            </div>

                            {/* The Form */}
                            <CaseForm />
                        </>
                    )}

                    {/* How it works reminder */}
                    <div className="mt-12 grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-charcoal-layer/30 rounded-xl border border-electric-violet/30">
                            <div className="text-electric-violet text-2xl mb-2">✍️</div>
                            <div className="text-starlight-white text-sm font-medium">You&apos;re here</div>
                            <div className="text-steel-grey text-xs">State your case</div>
                        </div>
                        <div className="p-4 bg-charcoal-layer/30 rounded-xl border border-white/10 opacity-60">
                            <div className="text-steel-grey text-2xl mb-2">🔗</div>
                            <div className="text-steel-grey text-sm font-medium">Next</div>
                            <div className="text-steel-grey text-xs">Share the link</div>
                        </div>
                        <div className="p-4 bg-charcoal-layer/30 rounded-xl border border-white/10 opacity-60">
                            <div className="text-steel-grey text-2xl mb-2">⚖️</div>
                            <div className="text-steel-grey text-sm font-medium">Then</div>
                            <div className="text-steel-grey text-xs">Get the verdict</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
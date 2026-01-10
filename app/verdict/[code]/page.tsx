import { createClient } from '@/utils/supabase/server';
import { getCaseWithVerdict } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';

import { VerdictReceipt } from '@/components/VerdictReceipt';
import { VerdictRuling } from '@/components/VerdictRuling';

interface VerdictPageProps {
    params: Promise<{ code: string }>;
}

export default async function VerdictPage({ params }: VerdictPageProps) {
    const { code } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get case with verdict
    const result = await getCaseWithVerdict(code);

    if (!result) {
        notFound();
    }

    const { case: caseData, verdict } = result;

    if (!verdict || caseData.status !== 'complete')  
        redirect(`/case/${code}`);

    return (
        <div className="min-h-screen">

            <main className="pt-28 md:pt-32 px-4 md:px-10 pb-20">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-verdict-green/20 text-verdict-green text-sm font-bold rounded-full mb-4 animate-fade-in">
                            <span>✅</span>
                            <span>VERDICT DELIVERED</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-starlight-white mb-4 animate-fade-in-up">
                            The Verdict Is In
                        </h1>
                        <p className="text-steel-grey text-lg">
                            Case <span className="text-electric-violet font-mono">{code}</span> has been decided
                        </p>
                    </div>

                    {/* Two-column layout on desktop */}
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Receipt Style (Left) */}
                        <div>
                            <h2 className="text-starlight-white font-bold mb-4 flex items-center gap-2">
                                <span>📱</span>
                                <span>Quick Receipt</span>
                                <span className="text-xs text-steel-grey font-normal">(Perfect for sharing)</span>
                            </h2>
                            <VerdictReceipt caseData={caseData} verdict={verdict} />
                        </div>

                        {/* Detailed Ruling (Right) */}
                        <div>
                            <h2 className="text-starlight-white font-bold mb-4 flex items-center gap-2">
                                <span>📜</span>
                                <span>Official Ruling</span>
                                <span className="text-xs text-steel-grey font-normal">(Full analysis)</span>
                            </h2>
                            <VerdictRuling caseData={caseData} verdict={verdict} />
                        </div>
                    </div>

                    {/* New Case CTA */}
                    <div className="mt-12 text-center">
                        <div className="inline-block p-8 bg-charcoal-layer/30 border border-white/5 rounded-2xl">
                            <p className="text-steel-grey mb-4">Got another argument to settle?</p>
                            <a
                                href="/submit"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-electric-violet to-cyber-blue text-white font-bold rounded-xl hover:shadow-electric-glow transition-all"
                            >
                                ⚖️ Start a New Case
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
